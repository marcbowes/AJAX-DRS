/* Create sortable buttons */
$(document).ready(function() {
	//Checkes wether to fetchData updates from the online repo.
	if($.cookie("fetchOnline") == "true"){
		document.getElementById("checkOnline").checked = true;
		fetchData();
	}
	createSorts();
  //Dynamically reloads info based on fragments.
  $.fragmentChange(true);
  $(document).bind("fragmentChange.page", function() {
      if($.fragment()["page"] != null){
				var meta = $.fragment()["page"].split(":");
	      if($.fragment()["type"] == "meta"){
	          loadMeta(meta[0],meta[1]);
	          return false;
	      }else if($.fragment()["type"] == "sort"){
	          loadSort(meta[1],meta[0]);
	          return false;
	      }
			}
  });
  
  if ($.fragment()["page"]){
    $(document).trigger("fragmentChange.page");
  }
});

/*
	Function to change the checkOnline setting in cookies.
*/
function checkBox(){
		if(document.getElementById("checkOnline").checked){
			$.cookie("fetchOnline", "true", { expires: 7});
		}else{
			$.cookie("fetchOnline", "false", {expires: 7});
		}
}

/*
	Function that creates the sort buttons when the page is loaded. 
*/
function createSorts() {
  for(file in files){
      $("#browse-options").append(
          "<a id=\"" + file + "\" class=\"button\" href=\"#page=" + capitalise(file) + ":" +  files[file][0] + "&type=sort&number=1\" class=\"green-button pcb\"> <span>" + capitalise(file) + "</span></a>"
        );
  }  
}

var print = ""; //Temp variable used for output.

/*
	Method that combines an offline list specified by file and sort_by
	with the extra online insertions.
*/
function createCombinedList(file, sort_by){
	var metas = new Array();
  $.ajax({url: "lists/" + file, async: false, success: function(index){
		metas = index.split("\n");
  }});
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
				if(!force_page_count || onlineMetaFiles[i][uncapitalise(sort_by)] != null){
					//if its in this file.
					if(!force_page_count || onlineMetaFiles[i][uncapitalise(sort_by)] == file){
						if(onlineMetaFiles[i]["file"].getElementsByTagName(uncapitalise(sort_by))[0] != null){
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
						
							var prev_metas = null;
							var last_meta_sorted_field_value = null;
						
							if(file != files[uncapitalise(sort_by)][0]){							
								prevfile = uncapitalise(sort_by) + (parseInt(file.substring(sort_by.length))-1);
								$.ajax({url: "lists/" + prevfile, async: false, success: function(index){
									prev_metas = index.split("\n");
									last_meta_sorted_field_value = prev_metas[prev_metas.length-2].split(";")[2];
							  }});
							}
							var inserted = false;
							for(j = 0; j < combinedList.length; j++){							
								//Need to make sure that it is bigger than the previous entry.
								if(combinedList[j]["sorted_field"] > field_value){
									if(prev_metas == null){				
										combinedList.splice(j,0,metafile);
										inserted = true;
										break;
									}else{
										if(last_meta_sorted_field_value < field_value){
											combinedList.splice(j,0,metafile);
											inserted = true;
											break;
										}
									}
								}								
							}
							//alert(last_meta_sorted_field_value + " " + field_value);
							if(inserted == false && file == files[uncapitalise(sort_by)][files[uncapitalise(sort_by)].length-1] && last_meta_sorted_field_value < field_value){
								combinedList.push(metafile);
							}							
						}//end content check
					}
				}
			}
			return combinedList;
}

/* 
	Method to display the sorted list of files
 	Takes in the file containing the sorted list as
 	well as the heading. 

	Very trixy to add online stuff to offline. Cant constain the page limit well.
	Have to:
	-Read entire offline list into memory
	-Add online pieces that fit in list
	-Display list 
	
	Trying to fix pagination.
	VERY VERY COMPLICATED.
	
	Need to work out which files are needed, then build those lists and take what is needed from each.
*/
function loadSort(file, sort_by){
		for(durr in files){
			if(durr == uncapitalise(sort_by)){
				$("#" + durr).removeClass("button").addClass("button-selected");
			}else{
				$("#" + durr).removeClass("button-selected").addClass("button");
			}
		}

    		
		print = "";
    //print+=("<h2>" + sort_by + "</h2><br/>");
		//work out what offline lists are needed.
		//To do this, we find the starting point then see if the next file is needed.
		//To find the starting point, 
		//1. we work out how many extra files have been added up to this point. 
		//2. Then subtracting the size of the previous list.
		//3. If the answer is negative then we know to start at the point after that |number|.
		//4. Else if the answer is positive, we take that number and subtract the size of the file before it.
		//5. Once we have the starting point, we add the page size, if this is bigger than the size for that file, 
		//we know we need the next file.
		
		var page = file;
		var start = 0;
		var nextPage = false;
		//1.
		var extra = calcExtra(file);
		if(extra > 0){
			//2.			
			var prev_page = uncapitalise(sort_by) + (parseInt(file.substring(sort_by.length))-1);//setCharAt(file, file.length-1, parseInt(file.substring(sort_by.length))-1);
		  var prevListSize = pageSize;
			
			if(numFiles[prev_page] != null){
					prevListSize = prevListSize + numFiles[prev_page];
			}
			//3 & 4.
			while(extra > prevListSize){
				extra = extra - prevListSize;
				prev_page = setCharAt(prev_page, prev_page.length-1, parseInt(prev_page.substring(sort_by.length))-1);
				prevListSize = pageSize;
					
			  if(numFiles[prev_page] != null){
						prevListSize = prevListSize + numFiles[prev_page];
				}
			}
			start = ((extra - prevListSize)*-1);
			page = prev_page;
			//start on prev_page @ start.
			//5.
			if(start+pageSize > prevListSize){
				nextPage = true;
			}			
		}
		
		startList = createCombinedList(page, sort_by);
		var combinedList = new Array();
		var count = 0;
		for(i = start; i < startList.length; i++){
			combinedList.push(startList[i]);
			count = count+1;
			if(force_page_count && count >= pageSize){
				break;
			}
		}
				
		//Now do the same for the next page if it is needed	
		
		if(nextPage){
			var nextList = createCombinedList(setCharAt(page,page.length-1,parseInt(page[page.length-1])+1), sort_by);
			for(i = 0; i < nextList.length; i++){
				combinedList.push(nextList[i]);
				count = count+1;
				if(count >= pageSize){
					break;
				}
			}
		}
			
		//Create final list to be displayed
		
		
		
		
		
		//*************************
		//Display lists
		//*************************
		current_value = "";
		
		if(force_page_count){
			print+=("<ol start=\"" + ((file.substring(sort_by.length)*pageSize) + 1) + "\">");
		}else{
			print+=("<ul>");
		}
    for(i = 0; i < combinedList.length; i++){
		      
        print+=("<li><a href=\"#page=" + combinedList[i]["file"] + ":" +  combinedList[i]["locality"] + "&type=meta\"><h4>" + combinedList[i]["representation"] + "</h4>");
				
				var sorted_field_rep = combinedList[i]["sorted_field"];
				if(sorted_field_rep.length > 150){
					sorted_field_rep = sorted_field_rep.substring(0,150) + "...";
				}
				
				print+=("<small>" + sort_by + " : " + sorted_field_rep  + "</small>")
				
				print+=("</a></li>");
    
        //var line = "<li> <a href=\"#page=" + combinedList[i]["file"] + ":" +  combinedList[i]["locality"] + "&type=meta\">" + combinedList[i]["representation"] + "</a></li>";
        //print+=(line);           
    
    }
    if(force_page_count){
    	print+=("</ol>");    
		}else{
			print+=("</ul>");
		}   
    $("#browse-results").html(print)        
    sort_by = uncapitalise(sort_by)
    


		//********************
    //Pages
		//********************
    
		$("#pages").html("");
    current_page = parseInt($.fragment()["number"]);
		var pages = new Array();
		var max = files[sort_by].length;
		if(extraPages[sort_by] != null){
			max += extraPages[sort_by].length;
		}
		
		for(i = current_page - 3; i <= (current_page + 3); i++){
			if(i > 0 && i < max){
				pages.push(i);
			}
		}
		
		if($.inArray(1, pages) < 0){
			pages.splice(0, 0, 1);
		}
		if($.inArray(max, pages) < 0){
			pages.push(max);
		}
		
		if(current_page != 1){
			//previous page
			$("#pages").append("<a class=\"number\" href=\"#page=" + capitalise(sort_by) + ":" +  files[sort_by][parseInt(current_page)-2] + "&type=sort&number=" + (parseInt(current_page)-1) + "\">Previous</a> ");
		}
				
		for(i = 0; i < pages.length; i++){
			page = parseInt(pages[i]);
			if(page == current_page){
				$("#pages").append("<a class=\"current\"> " + page + "</a>");
			}else{
				if(page <= files[uncapitalise(sort_by)].length){
					$("#pages").append("<a class=\"number\" href=\"#page=" + capitalise(sort_by) + ":" +  files[sort_by][page-1] + "&type=sort&number=" + page + "\">" + (page) + "</a> ");
				}else{
					$("#pages").append("<a class=\"number\" href=\"#page=" + capitalise(sort_by) + ":" +  extraPages[sort_by][(page-1) - (files[sort_by].length)] + "&type=sort&number=" + page + "\">" + (page) + "</a> ");
				}
			}
			if(page != max && (parseInt(pages[i+1])) != (page+1)){
				$("#pages").append(". . . ");
			}
		}
		
		if(current_page != max){
			//next page
			$("#pages").append("<a class=\"number\" href=\"#page=" + capitalise(sort_by) + ":" +  files[sort_by][parseInt(current_page)] + "&type=sort&number=" + (parseInt(current_page)+1) + "\">Next</a> ");
		}
		
		/*
		for(i = 0;i < files[sort_by].length; i++){
        if(i == parseInt(file.substring(sort_by.length))){
            $("#pages").append("<a class=\"current\"> " + (i+1) + "</a>");
        }else{
            $("#pages").append("<a class=\"number\" href=\"#page=" + capitalise(sort_by) + ":" +  files[sort_by][i] + "&type=sort\">" + (i+1) + "</a> ");
        }
    }
		if(extraPages[sort_by] != null){
			for(i = files[sort_by].length; i < (extraPages[sort_by].length + files[sort_by].length); i++){
				if(i == parseInt(file.substring(sort_by.length))){
	          $("#pages").append("<a class=\"current\">" + (i+1) + "</a>");
	      }else{
	          $("#pages").append("<a class=\"number\" href=\"#page=" + capitalise(sort_by) + ":" +  extraPages[sort_by][i - (files[sort_by].length)] + "&type=sort\">" + (i+1) + "</a> ");
	      }
			}
		}
		*/
		
		
		$("#pages").append("<p/><div> <small>Jump To Page </small><input style=\"width:40px;\" type=\"text\" id=\"pageNumber\" /> <a class=\"button\" onclick=\"jumpToPage();\">Submit</a> </div>");
    //$("pages")


		//*****************
		// Category Browse
		//****************		
		if(category_sort[sort_by] != null){
			//CLear it
			$("#quick_nav").show();
			$("#category_browse").html("<ul>")
			for(item in category_sort[sort_by]){
				
				$("#category_browse").append("<li>" + "<a href=\"#page=" + capitalise(sort_by) + ":" +  files[sort_by][category_sort[sort_by][item]] + "&type=sort&number=" + (parseInt(category_sort[sort_by][item])+1) + "\">" + (item) + "</a> " + "</li>")
			}
			$("#category_browse").append("</ul>")
		}else{
			$("#quick_nav").hide();
		}
		
}

function jumpToPage(){
	var sort_by = uncapitalise($.fragment()["page"].split(":")[0]);
	pageNum = document.getElementById("pageNumber").value;
	var max = files[sort_by].length;
	if(extraPages[sort_by] != null){
		max += extraPages[sort_by].length;
	}
	if(pageNum <= max && pageNum > 0){
		if(pageNum <= files[sort_by].length){
			//normal page
			$.setFragment({"page" : (capitalise(sort_by) + ":" + files[sort_by][pageNum-1]), "type" : "sort", "number" : pageNum});
		}else{
			//extra page
			$.setFragment({"page" : (capitalise(sort_by) + ":" + extraPages[sort_by][(pageNum-1) - (files[sort_by].length)]), "type" : "sort" , "number" : pageNum});
		}
	}
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
						if(node.childNodes[i].childNodes[0] != null && node.childNodes[i].childNodes[0].nodeValue != null && node.childNodes[i].childNodes[0].nodeValue.replace(/\n/g, "").replace(/\s/g, "").length > 0){
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

