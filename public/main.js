fb_username = ""
$("#mybutton").click(function(){
    fb_username = $("#fb_username").val()
    $("#getfbusername").hide()
    showd3graph(fb_username)
})

class Graph{
    constructor(data){
        this.people = {} //maps username -> name
        this.friends = {} // maps username -> list of friends
        this.connections = {} // maps username -> friends only in one direction
        this.edges = []
        this.nodes = []
        this.node_indices = {}
        for(var p in data){
            var person = data[p]
            var list_of_friends = JSON.parse(person['friends'])
            this.people[person['username']] = person['name']
            this.friends[person['username']] = list_of_friends
            this.node_indices[person['username']] = this.nodes.length
            this.nodes.push({"name": person['name'],"username":person['username']})
            //compute connections and edges
            for(var f in list_of_friends){
                var friend_name = list_of_friends[f]
                if(!(friend_name in this.connections && this.connections[friend_name].indexOf(person['username']) >=0)){
                    if(! (person['username'] in this.connections)){
                        this.connections[person['username']] = []
                    }
                    if(this.connections[person['username']].indexOf(friend_name) < 0){
                        this.connections[person['username']].push(friend_name)
                        this.edges.push({"source":person["username"],"target":friend_name,"weight" :1})
                    }
                }
            }
            
        }
        

    }

    get_dist(source){
        var b = -1
        var e = 0
        var q = [source]
        var v = new Set([source])
        var d = {}
        d[source] = 0
        while(b!=e){
            b += 1
            var current = q[b]
            var friends = this.friends[current]
            for(var f in friends){
                var this_friend = friends[f]
                if(!v.has(this_friend)){ //not visited
                    q.push(this_friend)
                    e += 1
                    v.add(this_friend)
                    d[this_friend] = d[current] + 1
                }
            }
        }
        return d
    }
}
function showgraph(fb_username){
    console.log(fb_username)
    d3.csv("people.csv", function(data) {

        console.log(JSON.parse(data[0]['friends']));
        people = data
        nodes = [[],[],[]]
        friend_list = []
        for(p in people){
            
            person = people[p]
            if(person['username'] == fb_username){
                console.log(JSON.parse(person['friends']))
                nodes[1].push(person['username'])
                friends = JSON.parse(person['friends'])
                for(f in friends){
                    if(friends[f] != null){
                       friend_list.push([person['username'],friends[f]]) 
                       nodes[1].push(friends[f])
                    }
                }
            }
        }

        for(p in people){
            person = people[p]
            if(nodes[1].indexOf(person['username']) >= 0){
                friends = JSON.parse(person['friends'])
                for(n in nodes[1]){
                    myfriend = nodes[1][n]
                    if(friends.indexOf(myfriend) >= 0){
                        console.log(person + ' and ' + myfriend + ' are friends')
                        friend_list.push([person['username'],myfriend])
                    }
                }
            }

        }
        

        var G3 = new jsnx.Graph();

        G3.addNodesFrom(nodes[0], {group:0});
        G3.addNodesFrom(nodes[1], {group:1});
        // G3.addNodesFrom(nodes[2], {group:2});

        G3.addEdgesFrom(friend_list);

        var color = d3.scale.category20();
        jsnx.draw(G3, {
            element: '#chart3',
            layoutAttr: {
                charge: -120,
                linkDistance: 20
            },
            nodeAttr: {
                r: 5,
                title: function(d) { return d.label;}
            },
            nodeStyle: {
                fill: function(d) { 
                    return color(d.data.group); 
                },
                stroke: 'none'
            },
            edgeStyle: {
                stroke: '#999'
            }
        }, true);
    });  
}

function showd3graph(fb_username){
    
    var width = 1000,
        height = 1000

    var svg = d3.select("#chart3").append("svg")
        .attr("width", width)
        .attr("height", height);

    var force = d3.layout.force()
        .gravity(.05)
        .distance(100)
        .charge(-100)
        .size([width, height]);

    d3.csv("people.csv", function(data) {
        g = new Graph(data)
        d = g.get_dist(fb_username) 
        nodes = []
        links = []
        for(n in g.nodes){
            node = g.nodes[n]
            if(d[node["username"]] < 2){
                nodes.push({"name":node["name"],"username":node["username"],"group":d[node["username"]]})
            }
            
        }
        for(e in g.edges){
            edge = g.edges[e]
            if(d[edge["source"]] < 2 && d[edge["target"]] <2){
                links.push({"source":g.node_indices[edge["source"]], "target":g.node_indices[edge["target"]], "weight":1}) 
            }
        }


      force
          .nodes(nodes)
          .links(links)
          .start();

      var link = svg.selectAll(".link")
          .data(links)
        .enter().append("line")
          .attr("class", "link")
        .style("stroke-width", 1 /**function(d) { return Math.sqrt(d.weight); }**/);

      var node = svg.selectAll(".node")
          .data(nodes)
        .enter().append("g")
          .attr("class", "node")
         // .call(force.drag);

      node.append("circle")
          .attr("r","5");

      node.append("svg:title")
          .attr("dx", 12)
          .attr("dy", ".35em")
          .text(function(d) { return d.name });

      force.on("tick", function() {
        link.attr("x1", function(d) { return d.source.x; })
            .attr("y1", function(d) { return d.source.y; })
            .attr("x2", function(d) { return d.target.x; })
            .attr("y2", function(d) { return d.target.y; });

        node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
      });
    });
}
