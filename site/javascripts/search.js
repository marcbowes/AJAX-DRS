var indices = new Array();
var untappedIndices = 0;

/* On DOM-Ready */
$(function() {
  /* Clicking search */
  $("#search_submit").live("click", function() {
    find($("#search_terms").val());
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
  
  untappedIndices = terms.length;
  
  for (i = 0; i < terms.length; i++) {
    tapIndex(terms[i][0], terms[i][1], string);
  }
}

function find_real(string) {
  var terms = get_terms(string);
  var items = new Array();
  
  /* for some reason a foreach prints integers? */
  for (i = 0; i < terms.length; i++) {
    var index = indices[terms[i][0]][terms[i][1]];
    for (item in index) {
      if (!items[item]) {
        items[item] = index[item];
      } else {
        items[item] += index[item];
      }
    }
  }
  
	var result = "<table>";
	result += "<thead><tr><th>Display name</th><th>Rank</th></tr><tbody>"
  for (item in items) {
    var shortname = item.split(".metadata")[0];
    result += "<tr><td><a href=\"../data/" + shortname + "\" class=\"result\">" + shortname + "</a></td>";
    result += "<td>" + items[item] + "</td></tr>";
  }
  result += "</tbody></table>";
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
