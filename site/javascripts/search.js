var indices = new Array();
var idxList = new Array();
var idsList = new Array();
var untappedIndices = 0;
var searchTerms;

/* On DOM-Ready */
$(function() {
  /* Load list of indices */
  $.get("lists/indices", null, function(list) {
    _list = list.split("\n");
    for (i = 0; i < _list.length; i++) {
      idxList[_list[i]] = true;
    }
  }, "text");
  
  /* Load document identifiers */
  $.get("lists/identifiers", null, function(list) {
    _list = list.split("\n");
    for (i = 0; i < _list.length; i++) {
      var attrs = _list[i].split(":");
      idsList[attrs[1]] = attrs[2];
    }
  }, "text");
  
  $("#results-content-box").hide();
  
  /* Clicking search */
  $("#search_submit").live("click", function() {
    find($("#search_terms").val());
    $("#results-content-box").show();
    return false; /* disable redirection */
  });
});

function get_terms(string) {
  var terms = string.split(/[\s-\/]/);
  for (i = 0; i < terms.length; i++) {
    var term = terms[i];
    var idx = term.indexOf(":");
    terms[i] = new Array(2);
    terms[i][0] = (idx == -1 ? "" : term.substring(0, idx));
    terms[i][1] = stemmer(idx == -1 ? term : term.substring(idx + 1).replace(/[^\d\w]/g, ""));
  }
  return terms;
}

function find(string) {
  string = string.toLowerCase();
  var terms = get_terms(string);
  
  untappedIndices = 0;
  searchTerms = new Array();
  for (i = 0; i < terms.length; i++) {
    if (idxList[terms[i][1]] == true) {
      searchTerms.push(terms[i][1]);
      untappedIndices++;
    }
  }
  
  if (untappedIndices > 0) {
    for (i = 0; i < terms.length; i++) {
      tapIndex(terms[i][0], terms[i][1], string);
    }
  } else {
    results("<strong>Sorry, no results found.</strong>");
  }
}

function find_real(string) {
  var terms = get_terms(string);
  var items = new Array();
  
  for (i = 0; i < terms.length; i++) {
    var index = indices[terms[i][0]][terms[i][1]];
    for (item in index) {
      if (!items[item]) {
        items[item] = new Array();
      }
      items[item].push(index[item]);
    }
  }
  
	var result = "<table>";
  for (item in items) {
    var sum = 0;
    for (i = 0; i < items[item].length; i++) {
      var count = items[item][i];
      sum += count;
    }
    var ln = parseInt(idsList[item]);
    items[item] = sum / (Math.sqrt(terms.length) * Math.sqrt(ln));
    
    var shortname = item.split(".metadata")[0];
    result += "<tr><td><a href=\"data/" + shortname + "\" class=\"result\">" + shortname + "</a></td>";
    result += "<td>" + items[item] + "</td></tr>";
  }
  result += "</table>";
  results(result);
}

function tapIndex(meta, word, searchString) {
  if (!indices[meta] || !indices[meta][word]) {
    try {
      $.get("indices/" + (meta == "" ? "" : meta + "/") + word, null, function(index) {
        var listings = index.split("\n");
        var index = new Array();
        for (i = 0; i < listings.length; i++) {
          var documentToCount = listings[i].split(":");
          if (documentToCount.length == 2) {
            index[documentToCount[0]] = parseInt(documentToCount[1]);
          }
        }
        if (!indices[meta])
          indices[meta] = new Array();
        indices[meta][word] = index;
        tapComplete(meta, word, searchString);
      }, "text");
    } catch (error) {
      tapComplete(meta, word, searchString);
    }
  } else {
    tapComplete(meta, word, searchString);
  }
}

function tapComplete(meta, word, searchString) {
  untappedIndices--;
  
  if (untappedIndices == 0) {
    find_real(searchString);
  }
}

function results(results) {
  $("#search_results").html(results);
}
