/* On DOM-Ready */
$(function() {
  /* Unobtrusively apply behavior to the page */
  
  /* #1 ]]    Clicking search */
  $("#search_submit").live("click", function() {
    results(find($("#search_terms").val()));
    return false; /* disable redirection */
  });
});

function find(string) {
  var terms = string.split(/\s/);
  
  /* for some reason a foreach prints integers? */
  for (i = 0; i < terms.length; i++) {
    var term = terms[i];
    var index = loadIndex(term);
    /* HAX - pretend its loaded ;p */
    index = "file1";
    return index;
  }
}

function loadIndex(word) {
  $.get("indices/" + word, null, function(index) {
    return index.split("\n");
  });
}

function results(list) {
  $("#search_results").html(list);
}
