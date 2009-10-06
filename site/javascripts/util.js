/*
	Some javascript utility methods i need.
*/

/* Function to capitalise a string */
function capitalise(str){
    var letter = str.substr(0,1);
    return letter.toUpperCase() + str.substr(1);
}

/* Function to downcase the first letter of a string */
function uncapitalise(str){
    var letter = str.substr(0,1);
    return letter.toLowerCase() + str.substr(1);
}

/* Function to set a character in a string */
function setCharAt(str,index,chr) {
	if(index > str.length-1) return str;
	return str.substr(0,index) + chr + str.substr(index+1);
}

/* Function to calculate the number of extras inserted into a page */
function calcExtra(filename){
	var extra = 0;
	// if(numFiles[filename] != null){
	// 	  extra = numFiles[filename];
	// 	}
	for(i = filename[filename.length-1]; i > 0; i--){
		var tempname = filename;
		tempname = setCharAt(tempname,tempname.length-1,i-1);
		if(numFiles[tempname] != null){
				extra = extra + numFiles[tempname];
		}
	}
	return extra;
}
