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

function find(string) {
  var terms = string.split(/\s/);
  untappedIndices = terms.length;
  
  /* for some reason a foreach prints integers? */
  for (i = 0; i < terms.length; i++) {
    tapIndex(terms[i], string);
  }
}

function find_real(string) {
  var terms = string.split(/\s/);
  
  /* for some reason a foreach prints integers? */
  for (i = 0; i < terms.length; i++) {
    alert("term: " + terms[i] + " -- \n" + indices[terms[i]]);
  }
}

function tapIndex(word, searchString) {
  if (!indices[word]) {
    try {
      $.get("indices/" + word, null, function(index) {
        var listings = index.split("\n");
        indices[word] = listings;
        tapComplete(word, searchString);
      });
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
