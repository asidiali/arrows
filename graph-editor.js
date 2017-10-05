window.onload = function()
{
    var search = window.location.search.substring(1);
    search = JSON.parse('{"' + decodeURI(search).replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g,'":"') + '"}')
    var tabIndex = search.tab;

    var data = [];
    $.ajax({
      url: "https://arrows.sidia.li/diagrams",
      type: "GET",
      success: function (response) {
        var data = response.data;
        for (var i = 0; i < data.length; i++) {
          data[i].markup = decodeURI(data[i].markup);
        }
        console.log(data[tabIndex - 1])
        run(data, tabIndex, data[tabIndex - 1]);
      }
    });

}

function updateTitle(index, title, data) {
  $.ajax({
    url: "https://arrows.sidia.li/update/title",
    data: JSON.stringify({
      index: index,
      title: title,
    }),
    contentType: "application/json",
    type: "POST",
    success: function (response) {
      data[index - 1].title = title;
      updateTabs(data);
      console.log(response);
    }
  });
}

function updateMarkup(index, markup, data) {
  $.ajax({
    url: "https://arrows.sidia.li/update/markup",
    data: JSON.stringify({
      index: index,
      markup: markup,
    }),
    contentType: "application/json",
    type: "POST",
    success: function (response) {
      data[index - 1].markup = markup;
      console.log(response);
    }
  });
}
function createNewDiagram(index, callback, data) {
  $.ajax({
    url: "https://arrows.sidia.li/new",
    data: JSON.stringify({
      index: index,
    }),
    contentType: "application/json",
    type: "POST",
    success: function (response) {
      console.log(response);
      callback();
    }
  });
}

function updateTabs(data) {
  document.getElementById("tab-menu-list").innerHTML = "";
  if (data.length) {
    for (var i = 0; i < data.length; i++) {
      var li = document.createElement("li");
      li.appendChild(document.createTextNode(data[i].title));
      // li.setAttribute("data-diagram", data[i].markup);
      li.setAttribute("data-index", i + 1);
      document.getElementById("tab-menu-list").appendChild(li);
    }
  }
}

function run (data, tabIndex, doc) {
    var graphModel;

    updateTabs(data);

    document.getElementById("tab-menu-list").addEventListener("click", function (e) {
      var index = e.target.dataset.index;
      var url = window.location.href.split("?");
      window.location.href = url[0] + "?tab=" + index;
    });

    document.getElementById("new-tab-btn").addEventListener("click", function (e) {
      var children = document.getElementById("tab-menu-list").children;
      var count = 0;
      for (var i = 0; i < children.length; i++) {
        if (children[i].dataset.index > count) count = children[i].dataset.index;
      }
      var url = window.location.href.split("?");
      var newIndex = parseInt(count, 10) + 1;
      createNewDiagram(newIndex, function () {
        window.location.href = url[0] + "?tab=" + newIndex;
      }, data);
    });

    // Default style choice to Bootstrap every time
    localStorage.setItem("graph-diagram-style", "style/graph-style-bootstrap.css");
    // graphModel = parseMarkup( localStorage.getItem( "graph-diagram-markup-" + tabIndex ) );
    // save(formatMarkup());
    // draw();

    document.getElementById("tab-menu-btn").addEventListener("click", function (e) {
      document.getElementById("tab-menu").style.display = 'block';
    });

    document.getElementById("close-tab-menu-btn").addEventListener("click", function (e) {
      document.getElementById("tab-menu").style.display = 'none';
    });


    if ( !doc )
    {
        graphModel = gd.model();
        graphModel.createNode().x( 0 ).y( 0 );
          // localStorage.setItem("graph-diagram-title-" + tabIndex, "New Diagram " + tabIndex);
        document.getElementById("diagram-title").value = "New Diagram " + tabIndex;
        save( formatMarkup() );
    }
    if ( localStorage.getItem( "graph-diagram-style" ) )
    {
        d3.select( "link.graph-style" )
            .attr( "href", localStorage.getItem( "graph-diagram-style" ) );
    }
    graphModel = parseMarkup( doc.markup );
    if (doc.title) {
      document.getElementById("diagram-title").value = doc.title;
    } else {
      // localStorage.setItem("graph-diagram-title-" + tabIndex, "New Diagram " + tabIndex);
      document.getElementById("diagram-title").value = "New Diagram " + tabIndex;
    }

    document.getElementById("diagram-title").addEventListener("blur", function (e) {
      // localStorage.setItem("graph-diagram-title-" + tabIndex, e.target.value);
      // updateTabs();
      updateTitle(tabIndex, e.target.value, data);
    })

    var svg = d3.select("#canvas")
        .append("svg:svg")
        .attr("class", "graphdiagram");

    var diagram = gd.diagram()
        .scaling(gd.scaling.centerOrScaleDiagramToFitSvg)
        .overlay(function(layoutModel, view) {
            var nodeOverlays = view.selectAll("circle.node.overlay")
                .data(layoutModel.nodes);

            nodeOverlays.exit().remove();

            nodeOverlays.enter().append("circle")
                .attr("class", "node overlay")
                .call( d3.behavior.drag().on( "drag", drag ).on( "dragend", dragEnd ) )
                .on( "dblclick", editNode );

            nodeOverlays
                .attr("r", function(node) {
                    return node.radius.outside();
                })
                .attr("stroke", "none")
                .attr("fill", "rgba(255, 255, 255, 0)")
                .attr("cx", function(node) {
                    return node.x;
                })
                .attr("cy", function(node) {
                    return node.y;
                });

            var nodeRings = view.selectAll("circle.node.ring")
                .data(layoutModel.nodes);

            nodeRings.exit().remove();

            nodeRings.enter().append("circle")
                .attr("class", "node ring")
                .call( d3.behavior.drag().on( "drag", dragRing ).on( "dragend", dragEnd ) );

            nodeRings
                .attr("r", function(node) {
                    return node.radius.outside() + 5;
                })
                .attr("fill", "none")
                .attr("stroke", "rgba(255, 255, 255, 0)")
                .attr("stroke-width", "10px")
                .attr("cx", function(node) {
                    return node.x;
                })
                .attr("cy", function(node) {
                    return node.y;
                });

            var relationshipsOverlays = view.selectAll("path.relationship.overlay")
                .data(layoutModel.relationships);

            relationshipsOverlays.exit().remove();

            relationshipsOverlays.enter().append("path")
                .attr("class", "relationship overlay")
                .attr("fill", "rgba(255, 255, 255, 0)")
                .attr("stroke", "rgba(255, 255, 255, 0)")
                .attr("stroke-width", "10px")
                .on( "dblclick", editRelationship );

            relationshipsOverlays
                .attr("transform", function(r) {
                    var angle = r.start.model.angleTo(r.end.model);
                    return "translate(" + r.start.model.ex() + "," + r.start.model.ey() + ") rotate(" + angle + ")";
                } )
                .attr("d", function(d) { return d.arrow.outline; } );
        });

    function draw()
    {
        svg
            .data([graphModel])
            .call(diagram);
    }

    function save( markup )
    {
        updateMarkup(tabIndex, markup, data);
        // localStorage.setItem( "graph-diagram-markup-" + tabIndex, markup );
        // localStorage.setItem( "graph-diagram-style", d3.select( "link.graph-style" ).attr( "href" ) );
        // updjjjuateTabs();
    }

    var newNode = null;
    var newRelationship = null;

    function findClosestOverlappingNode( node )
    {
        var closestNode = null;
        var closestDistance = Number.MAX_VALUE;

        var allNodes = graphModel.nodeList();

        for ( var i = 0; i < allNodes.length; i++ )
        {
            var candidateNode = allNodes[i];
            if ( candidateNode !== node )
            {
                var candidateDistance = node.distanceTo( candidateNode ) * graphModel.internalScale();
                if ( candidateDistance < 50 && candidateDistance < closestDistance )
                {
                    closestNode = candidateNode;
                    closestDistance = candidateDistance;
                }
            }
        }
        return closestNode;
    }

    function drag()
    {
        var node = this.__data__.model;
        node.drag(d3.event.dx, d3.event.dy);
        diagram.scaling(gd.scaling.growButDoNotShrink);
        draw();
    }

    function dragRing()
    {
        var node = this.__data__.model;
        if ( !newNode )
        {
            newNode = graphModel.createNode().x( d3.event.x ).y( d3.event.y );
            newRelationship = graphModel.createRelationship( node, newNode );
        }
        var connectionNode = findClosestOverlappingNode( newNode );
        if ( connectionNode )
        {
            newRelationship.end = connectionNode
        } else
        {
            newRelationship.end = newNode;
        }
        node = newNode;
        node.drag(d3.event.dx, d3.event.dy);
        diagram.scaling(gd.scaling.growButDoNotShrink);
        draw();
    }

    function dragEnd()
    {
        if ( newNode )
        {
            newNode.dragEnd();
            if ( newRelationship && newRelationship.end !== newNode )
            {
                graphModel.deleteNode( newNode );
            }
        }
        newNode = null;
        save( formatMarkup() );
        diagram.scaling(gd.scaling.centerOrScaleDiagramToFitSvgSmooth);
        draw();
    }

    d3.select( "#add_node_button" ).on( "click", function ()
    {
        graphModel.createNode().x( 0 ).y( 0 );
        save( formatMarkup() );
        draw();
    } );

    function onControlEnter(saveChange)
    {
        return function()
        {
            if ( d3.event.ctrlKey && d3.event.keyCode === 13 )
            {
                saveChange();
            }
        }
    }

    function editNode()
    {
        var editor = d3.select(".pop-up-editor.node");
        appendModalBackdrop();
        editor.classed( "hide", false );

        var node = this.__data__.model;

        var captionField = editor.select("#node_caption");
        captionField.node().value = node.caption() || "";
        captionField.node().select();

        var propertiesField = editor.select("#node_properties");
        propertiesField.node().value = node.properties().list().reduce(function(previous, property) {
            return previous + property.key + ": " + property.value + "\n";
        }, "");

        function saveChange()
        {
            node.caption( captionField.node().value );
            node.properties().clearAll();
            propertiesField.node().value.split("\n").forEach(function(line) {
                var tokens = line.split(/: */);
                if (tokens.length === 2) {
                    var key = tokens[0].trim();
                    var value = tokens[1].trim();
                    if (key.length > 0 && value.length > 0) {
                        node.properties().set(key, value);
                    }
                }
            });
            save( formatMarkup() );
            draw();
            cancelModal();
        }

        function deleteNode()
        {
            graphModel.deleteNode(node);
            save( formatMarkup() );
            draw();
            cancelModal();
        }

        captionField.on("keypress", onControlEnter(saveChange) );
        propertiesField.on("keypress", onControlEnter(saveChange) );

        editor.select("#edit_node_save").on("click", saveChange);
        editor.select("#edit_node_delete").on("click", deleteNode);
    }

    function editRelationship()
    {
        var editor = d3.select(".pop-up-editor.relationship");
        appendModalBackdrop();
        editor.classed( "hide", false );

        var relationship = this.__data__.model;

        var relationshipTypeField = editor.select("#relationship_type");
        relationshipTypeField.node().value = relationship.relationshipType() || "";
        relationshipTypeField.node().select();

        var propertiesField = editor.select("#relationship_properties");
        propertiesField.node().value = relationship.properties().list().reduce(function(previous, property) {
            return previous + property.key + ": " + property.value + "\n";
        }, "");

        function saveChange()
        {
            relationship.relationshipType( relationshipTypeField.node().value );
            relationship.properties().clearAll();
            propertiesField.node().value.split("\n").forEach(function(line) {
                var tokens = line.split(/: */);
                if (tokens.length === 2) {
                    var key = tokens[0].trim();
                    var value = tokens[1].trim();
                    if (key.length > 0 && value.length > 0) {
                        relationship.properties().set(key, value);
                    }
                }
            });
            save( formatMarkup() );
            draw();
            cancelModal();
        }

        function reverseRelationship()
        {
            relationship.reverse();
            save( formatMarkup() );
            draw();
            cancelModal();
        }

        function deleteRelationship()
        {
            graphModel.deleteRelationship(relationship);
            save( formatMarkup() );
            draw();
            cancelModal();
        }

        relationshipTypeField.on("keypress", onControlEnter(saveChange) );
        propertiesField.on("keypress", onControlEnter(saveChange) );

        editor.select("#edit_relationship_save").on("click", saveChange);
        editor.select("#edit_relationship_reverse").on("click", reverseRelationship);
        editor.select("#edit_relationship_delete").on("click", deleteRelationship);
    }

    function formatMarkup()
    {
        var container = d3.select( "body" ).append( "div" );
        gd.markup.format( graphModel, container );
        var markup = container.node().innerHTML;
        markup = markup
            .replace( /<li/g, "\n  <li" )
            .replace( /<span/g, "\n    <span" )
            .replace( /<\/span><\/li/g, "</span>\n  </li" )
            .replace( /<\/ul/, "\n</ul" );
        container.remove();
        return markup;
    }

    function cancelModal()
    {
        d3.selectAll( ".modal" ).classed( "hide", true );
        d3.selectAll( ".modal-backdrop" ).remove();
    }

    d3.selectAll( ".btn.cancel" ).on( "click", cancelModal );
    d3.selectAll( ".modal" ).on( "keyup", function() { if ( d3.event.keyCode === 27 ) cancelModal(); } );

    function appendModalBackdrop()
    {
        d3.select( "body" ).append( "div" )
            .attr( "class", "modal-backdrop" )
            .on( "click", cancelModal );
    }

    var exportMarkup = function ()
    {
        appendModalBackdrop();
        d3.select( ".modal.export-markup" ).classed( "hide", false );

        var markup = formatMarkup();
        d3.select( "textarea.code" )
            .attr( "rows", markup.split( "\n" ).length * 2 )
            .node().value = markup;
    };

    function parseMarkup( markup )
    {
        var container = d3.select( "body" ).append( "div" );
        container.node().innerHTML = markup;
        var model = gd.markup.parse( container.select("ul.graph-diagram-markup") );
        container.remove();
        return model;
    }

    var useMarkupFromMarkupEditor = function ()
    {
        var markup = d3.select( "textarea.code" ).node().value;
        graphModel = parseMarkup( markup );
        save( markup );
        draw();
        cancelModal();
    };

    d3.select( "#save_markup" ).on( "click", useMarkupFromMarkupEditor );

    var exportSvg = function ()
    {
        var rawSvg = new XMLSerializer().serializeToString(d3.select("#canvas svg" ).node());
        window.open( "data:image/svg+xml;base64," + btoa( rawSvg ) );
    };

    var openConsoleWithCypher = function (evt)
    {
        var cypher = d3.select(".export-cypher .modal-body textarea.code").node().value;
        cypher = cypher.replace(/\n  /g," ");
        var url="http://console.neo4j.org"+
            "?init=" + encodeURIComponent(cypher)+
            "&query=" + encodeURIComponent("start n=node(*) return n");
        d3.select( "#open_console" )
                    .attr( "href", url );
        return true;
    };

    d3.select( "#open_console" ).on( "click", openConsoleWithCypher );

    var exportCypher = function ()
    {
        appendModalBackdrop();
        d3.select( ".modal.export-cypher" ).classed( "hide", false );

        var statement = gd.cypher(graphModel);
        d3.select( ".export-cypher .modal-body textarea.code" )
            .attr( "rows", statement.split( "\n" ).length )
            .node().value = statement;
    };


    var chooseStyle = function()
    {
        appendModalBackdrop();
        d3.select( ".modal.choose-style" ).classed( "hide", false );
    };

    d3.select("#saveStyle" ).on("click", function() {
        var selectedStyle = d3.selectAll("input[name=styleChoice]" )[0]
            .filter(function(input) { return input.checked; })[0].value;
        d3.select("link.graph-style")
            .attr("href", "style/" + selectedStyle);

        graphModel = parseMarkup( doc.markup );
        save(formatMarkup());
        draw();
        cancelModal();
    });

    function changeInternalScale() {
        graphModel.internalScale(d3.select("#internalScale").node().value);
        draw();
    }
    d3.select("#internalScale").node().value = graphModel.internalScale();

    d3.select(window).on("resize", draw);
    d3.select("#internalScale" ).on("change", changeInternalScale);
    d3.select( "#exportMarkupButton" ).on( "click", exportMarkup );
    d3.select( "#exportSvgButton" ).on( "click", exportSvg );
	d3.select( "#exportCypherButton" ).on( "click", exportCypher );
    d3.select( "#chooseStyleButton" ).on( "click", chooseStyle );
    d3.selectAll( ".modal-dialog" ).on( "click", function ()
    {
        d3.event.stopPropagation();
    } );

    draw();
};
