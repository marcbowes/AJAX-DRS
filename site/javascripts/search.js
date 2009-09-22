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
    terms[i] = stemmer(terms[i].replace(/[^\d\w]/g, ""));
  }
  return terms;
}

function find(string) {
  string = string.toLowerCase();
  var terms = get_terms(string);
  
  untappedIndices = terms.length;
  
  for (i = 0; i < terms.length; i++) {
    tapIndex(terms[i], string);
  }
}

function find_real(string) {
  var terms = get_terms(string);
  var items = new Array();
  
  /* for some reason a foreach prints integers? */
  for (i = 0; i < terms.length; i++) {
    var index = indices[terms[i]];
    for (item in index) {
      if (!items[item]) {
        items[item] = index[item];
      } else {
        items[item] += index[item];
      }
    }
  }
  
  var result = "<ul>";
  for (item in items) {
    var shortname = item.split(".metadata")[0];
    result += "<li><a href=\"../data/" + shortname + "\" class=\"result\">" + shortname + "</a>";
    result += "<span class=\"rank\">" + items[item] + "</span></li>";
  }
  result += "</ul>";
  results(result);
}

function tapIndex(word, searchString) {
  if (!indices[word]) {
    try {
      $.get("indices/" + word, null, function(index) {
        var listings = index.split("\n");
        var index = new Array();
        for (i = 0; i < listings.length; i++) {
          var documentToCount = listings[i].split(":");
          if (documentToCount.length == 2) {
            index[documentToCount[0]] = parseInt(documentToCount[1]);
          }
        }
        indices[word] = index;
        tapComplete(word, searchString);
      }, "text");
    } catch (error) {
      tapComplete(word, searchString);
    }
  } else {
    tapComplete(word, searchString);
  }
}

function tapComplete(word, searchString) {
  untappedIndices--;
  if (untappedIndices == 0) {
    find_real(searchString);
  }
}

function results(results) {
  $("#search_results").html(results);
}
