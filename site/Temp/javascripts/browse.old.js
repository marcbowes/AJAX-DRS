/* Create sortable buttons */
$(document).ready(function() {
	createSorts();
  //Dynamically reloads info based on fragments.
  $.fragmentChange(true);
  $(document).bind("fragmentChange.page", function() {
      var meta = $.fragment()["page"].split(":");
      if($.fragment()["type"] == "meta"){
          loadMeta(meta[0],meta[1]);
          return false;
      }else{
          loadSort(meta[1],meta[0]);
          return false;
      }
  });
  
  if ($.fragment()["page"]){
    $(document).trigger("fragmentChange.page");
  }
});

/* Function that creates the sort buttons when the page is loaded. */
function createSorts() {
  for(file in files){
      $("#browse-options").append(
          "<a href=\"#\" class=\"green-button pcb\" onclick=\"setFrag('" + files[file][0] + "' , '" + capitalise(file) + "'); return false;\"> <span>" + capitalise(file) + "</span> </a>"
        );
  }  
}

/* Method to set the page fragment */
function setFrag(file,sort_by){
    $.setFragment({ "page" : (sort_by + ":" + file), "type" : "sort"});
}

/* Method to set the page fragment based on a metaFile*/
function metaFrag(metafile, locality){
    $.setFragment({ "page" : metafile + ":" + locality, "type" : "meta"});
}

var print = ""; //Temp variable used for output.

/* 
	Method to display the sorted list of files
 	Takes in the file containing the sorted list as
 	well as the heading. 

	Very trixy to add online stuff to offline. Cant constain the page limit well.
	Have to:
	-Read entire offline list into memory
	-Add online pieces that fit in list
	-Display list 
*/
function loadSort(file, sort_by){
    print = "";
    print+=("<h2>" + sort_by + "</h2><br/>");
    $.get("lists/" + file, null, function(index){
   
			metas = index.split("\n");
      
			//Read in offline list  
			
			var offlineList = new Array();
			
				for(i = 0; i < metas.length; i++){
					
					current_meta = metas[i].split(";");  
					if(current_meta != ""){
						
						var metafile = new Array();
						metafile["file"] = current_meta[0];
						metafile["representation"] = current_meta[1];
						metafile["sorted_field"] = current_meta[2];
						metafile["locality"] = "offline";
						offlineList[i] = metafile;
						
					}
					
				}				

				//Combine Offline and Online files.
				var combinedList = offlineList;
				for(i = 0; i < onlineMetaFiles.length; i++){
					if(onlineMetaFiles[i][uncapitalise(sort_by)] != null){
						if(onlineMetaFiles[i][uncapitalise(sort_by)] == file){
							var field_value = onlineMetaFiles[i]["file"].getElementsByTagName(uncapitalise(sort_by))[0].childNodes[0].nodeValue;
							//alert(field_value);
							var metafile = new Array();
							metafile["file"] = i;
							parts = representation.split(",");
							var rep = "";
							for(k = 0; k < parts.length; k++){
								if(onlineMetaFiles[i]["file"].getElementsByTagName(parts[k])[0] != null){
									rep += onlineMetaFiles[i]["file"].getElementsByTagName(parts[k])[0].childNodes[0].nodeValue;
									rep += ", ";
								}
							}
							rep = rep.substring(0, rep.length-2);
							
							metafile["representation"] = rep;
							metafile["sorted_field"] = field_value;
							metafile["locality"] = "online"
							
							var inserted = false;
							for(j = 0; j < combinedList.length; j++){							
								if(combinedList[j]["sorted_field"] > field_value){
									combinedList.splice(j,0,metafile);
									inserted = true;
									break;
								}								
							}
							if(inserted == false){
								combinedList.push(metafile);
							}							
							//alert("meekmeek");
						}
					}
				}
					
				
				//Display lists
				current_value = "";
				var extra = 0;
				for(i = file[file.length-1]; i > 0; i--){
					var tempname = file;
					tempname = setCharAt(tempname,tempname.length-1,i-1);
					if(numFiles[tempname] != null){
						extra = extra + numFiles[tempname];
					}
				}
				print+=("<ol start=\"" + ((file.substring(file.length-1, file.length)*5) + 1 + extra) + "\">");
        for(i = 0; i < combinedList.length; i++){
		          
            if(current_value != combinedList[i]["sorted_field"]){
                current_value = combinedList[i]["sorted_field"];
                print+=("<h4>" + current_value + "</h4>");
            }

            var line = "<li> <a href=\"#\" onclick=\"metaFrag('" + combinedList[i]["file"] + "' , '" + combinedList[i]["locality"] + "'); return false;\">" + combinedList[i]["representation"] + "</a></li>";
            print+=(line);           

        }

        print+=("</ol>");        
        $("#browse-results").html(print)        
        sort_by = uncapitalise(sort_by)
        
        //TODO :  Add pages using files[sort_by]. 
        //$("#browse-results").append(file.substring(file.length-1, file.length))
        $("#pages").html("Page:<br/>");
        for(i = 0;i < files[sort_by].length; i++){
            if(i == parseInt(file.substring(file.length-1, file.length))){
                $("#pages").append((i+1) + " ")
            }else{
                $("#pages").append("<a href=\"#\" onclick=\"setFrag('" + files[sort_by][i] + "' , '" + capitalise(sort_by) + "'); return false;\">" + (i+1) + "</a> ")
            }
        }
        //$("pages")
    });
}

/*
	Method to load metadata from an XML file.
*/
function loadMeta(metafile, locality){
    $("#pages").html("");
		if(locality == "offline"){    
			$("#browse-results").html("<h2>" + metafile + "</h2></br/>");		
			$.get("data/" + metafile, null, function(meta){
	        var xmlobject = parseXML(meta);
        
	        var root = xmlobject.childNodes[0];
	        print = "";
	        display(root);
	        $("#browse-results").append(print);
	        $("#browse-results").append("<a href=\"data/" + metafile.substring(0,metafile.length - ".metadata".length) + "\">Open source file</a>")
	    });
		}else{
			/*
			TODO : Show online stuff
			Online stuff will have the position of the meta in the array as the metafile.
			Will use this to access and display the data.
			*/
			var file = onlineMetaFiles[metafile]["file"].getElementsByTagName("link");
			if(file != null){
				$("#browse-results").html("<h2>" + file[0].childNodes[0].nodeValue + "</h2></br/>");				
			}else{
				$("#browse-results").html("<h2> Unkown file </h2></br/>");				
			}
			print = "";
			display(onlineMetaFiles[metafile]["file"]);
			$("#browse-results").append(print);
			if(file != null){
				$("#browse-results").append("<a href=\"" + file[0].childNodes[0].nodeValue + "\">Open source file</a>")
			}else{
				$("#browse-results").html("<a> No link to file </a>");				
			}
		}
}

function parseXML(txt){
	try //Internet Explorer
	  {
	  xmlDoc=new ActiveXObject("Microsoft.XMLDOM");
	  xmlDoc.async="false";
	  xmlDoc.loadXML(txt);
	  return xmlDoc;
	  }
	catch(e)
	  {
	  parser=new DOMParser();
	  xmlDoc=parser.parseFromString(txt,"text/xml");
	  return xmlDoc;
	  }
}

/*
	Method to recusivly display data loaded in from an XML file.
	Works in IE, Firefox and Chrome
*/
function display(node){
    print+=("<ul>");
    for(var i = 0; i < node.childNodes.length; i++){
        if(node.childNodes[i].nodeType == 1){            
						if(node.childNodes[i].childNodes[0].nodeValue != null && node.childNodes[i].childNodes[0].nodeValue.replace(/\n/g, "").replace(/\s/g, "").length > 0){
                print+=("<li><b>" + node.childNodes[i].nodeName + "</b> : " + node.childNodes[i].childNodes[0].nodeValue + "</li>")
            }else{
                print+=("<li><b>" + node.childNodes[i].nodeName + "</b> : ");
                display(node.childNodes[i]);
                print+=("</li>");
            }						
        }
    }
    print+=("</ul>");
}

