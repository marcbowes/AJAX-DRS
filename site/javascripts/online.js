/*
	Javascript to integrate online and offline systems for the Caljax system.
	
	Will fetch updates from the server via a XML request.
	
	Will then integrate these updates into the offline system.
	
	Needs to create an Online list representation as well as an array storing all the metadata sent over.
*/


/*
	Global variables to hold the list for the online meta files and the files themselves.
	
	onlineMetaFiles looks like:
	onlineMetaFiles -> metafiles -> File -> MetaData
															 -> Fields -> list (which list it is in for that field)
																						
*/
var onlineMetaFiles = new Array();
var numFiles = new Array();
var extraPages = new Array();

function fetchData(){
	var meta;
	$.ajax({url: "testdata/testdata.xml", async: false , success: function(index){
		meta = index;
	}});
      document.getElementById("busy").style.display = "block";
			var xmlobject = parseXML(meta);
      var onlineFiles = xmlobject.getElementsByTagName("file");	//metadata
			for(i = 0; i < onlineFiles.length; i++){ 
				var metafile = new Array();
				metafile["file"] = onlineFiles[i];
				if(force_page_count){
				//Now build which file it goes into for each of the categories in files
								for(file in files){																				//file in this case is the sort category
													var value = onlineFiles[i].getElementsByTagName(file);	//Get this onlineFiles value for that sort category
													if(value != null){
														value = value[0].childNodes[0].nodeValue;
														//alert(value);
														//Look through each of the files in that field
														for(j = 0; j < files[file].length; j++){
															var inserted = false;
															var metas = new Array();
															$.ajax({url: "lists/" + files[file][j], async: false, success: function(index){
																	metas = index.split("\n");								
																}
															});							
															//look through each of the entries in that list
															for(k = 0; k < metas.length; k++){
																var meta = metas[k].split(";");
																//If the onlineFile fits, save the filename in this file.
																//alert(meta[2] + " > " + value + " : ");
																if(meta[2] > value){
																	inserted = true;
																	metafile[file] = files[file][j];
																	break;
																}
															}//end of entry in file list	
															
															//If it gets to the end, and it hasnt been inserted then it inserts it at the end.
															if(inserted == true){
																break;
															}else if (files[file][j] == files[file][files[file].length-1]){
																metafile[file] = files[file][files[file].length-1];
															}							
														}//end of each file in that sort type
													}else{
														metafile[file] = null;
													}
													if(metafile[file] != null && numFiles[metafile[file]] != null){
														numFiles[metafile[file]] = numFiles[metafile[file]] + 1;
													}else if(metafile[file] != null){
														numFiles[metafile[file]] = 1;
													}
													
													
												}//end of sort type
			}
				onlineMetaFiles[i] = metafile;
			}


			//*********************************************************************
			//Now build the number of extra pages needed to fit all the new data.
			//*********************************************************************
			for(file in files){
				var lastPage = files[file][files[file].length-1];
				
				var extra = calcExtra(lastPage);
				if(numFiles[lastPage] != null){
					extra = extra + numFiles[lastPage];
				}
				//overflow = (pageSize - numberOnLastPage) - extra;
				var numberOnLastPage = 0;
				$.ajax({url: "lists/" + lastPage, async: false, success: function(index){
					numberOnLastPage = index.split("\n").length-1;
			  }});				
				
				var extraPageCount = Math.ceil((extra - (pageSize-numberOnLastPage))/pageSize);
				if(extraPageCount > 0){
					var tempExtraPages = new Array();
					for(j = 0; j < extraPageCount; j++){
						var newPageNum = parseInt(lastPage[lastPage.length-1]) + (j+1);
						tempExtraPages.push(setCharAt(lastPage,lastPage.length-1,newPageNum));
					}
					extraPages[file] = tempExtraPages;
				}
			}
			
			document.getElementById("busy").style.display = "none";
  
}