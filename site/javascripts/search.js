var indices = new Array();
var idxList = new Array();
var idsList = new Array();
var untappedIndices = 0;
var searchTerms;
var pages       = 0;
var currentPage = 0;

var priorityQueue = function () {
  // "private"
  var priorityArray = [];

  // "public"
  return {
    insert: function (name, priority) {
      var i = 0;
      while (i <= priorityArray.length && priority < ((priorityArray[i] || {"priority": Infinity}).priority || Infinity)) {                            
        i++;
      }                   
      priorityArray.splice(i, 0, {"name": name, "priority": priority});
      return true;            
    },
    get: function () {
      return (priorityArray.shift() || {"name": undefined}).name;
    },
    peek: function () {
      return (priorityArray[0] || {"name": undefined}).name;
    }
  };
}();

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
      idsList[attrs[1]] = {"ln": attrs[2], "loc": attrs[3]};
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
  var items = new Object();
  
  for (i = 0; i < terms.length; i++) {
    var index = indices[terms[i][0]][terms[i][1]];
    for (item in index) {
      if (!items[item]) {
        items[item] = new Array();
      }
      items[item].push(index[item]);
    }
  }
  
  var itemcount = 0;
  for (item in items) {
    itemcount++;
    
    var ln = parseInt(idsList[item].ln);
    var sum = 0;
    for (i = 0; i < items[item].length; i++) {
      var count = items[item][i];
      sum += count;
    }
    
    var n = item;
    var p = sum / (Math.sqrt(terms.length) * Math.sqrt(ln));
    priorityQueue.insert(n, p);
  }

  pages         = 1;
	var result    = "<table id=\"page-1\">";
  for (i = 1; i <= itemcount; i++) {
    if ((i - 1) % 10 == 0 && i > 10) {
      if (pages != 1)
        result += "</table>";
      pages = pages + 1;
      result += "<table id=\"page-" + pages + "\" style=\"display: none;\">";
    }
    
    var n = priorityQueue.get();
    result += "<tr><td><a href=\"data/" + idsList[n].loc.split("/site/data/")[1].split(".metadata")[0] + "\" class=\"result\">" + n.split(".metadata")[0] + "</a></td></tr>";
  }
  
  result += "</table><div class=\"pagination\"></div>";
  results(result);
  
  currentPage = 1;
  showPagination();
}

/* Pagination display */
function showPagination()
{
  var output = "";
  
  if (pages > 1)
  {
    /* Show pages 1 & 2 */
    for (i = 1; i < pages && i < 3; i++)
    {
      if (i == currentPage)
        output += "<a href=\"#\" class=\"current\">" + i + "</a>";
      else
        output += "<a href=\"#\">" + i + "</a>";      
    }
    
    /* If we aren't on page 3, then show a snip-off */
    if (currentPage > 4)
    {
      output += "... ";
    }
    
    /* Show context of the current page we're on (2 on each side) */
    for (i = currentPage - 1; i < pages && i < currentPage + 3; i++)
    {
      if (i < 3) continue; /* Take care not to redisplay earlier pages */
      
      if (i == currentPage)
        output += "<a href=\"#\" class=\"current\">" + i + "</a>";
      else
        output += "<a href=\"#\">" + i + "</a>";      
    }
    
    /* If the current page doesn't take us near the end, then snip-off and show last page */
    if (currentPage + 3 < pages)
    {
      output += "... <a href=\"#\">" + pages + "</a>";
    }
    else /* We were just short */
    {
      if (pages == currentPage)
        output += "<a href=\"#\" class=\"current\">" + pages + "</a>";
      else
        output += "<a href=\"#\">" + pages + "</a>";
    }
    
    /* Jump to page */
    output += "<p>";
    output += "<input type=\"text\" class=\"jumper\"></input><submit class=\"button\" href=\"#\">Jump</a>";
    output += "</p>";
  }
  
  $("#search_results .pagination").html(output);
  $("#search_results .pagination a").addClass("number");
  
  /* Pagination code */
  $("#search_results .pagination a").click(function() {
    $("#search_results table").hide();
    currentPage = parseInt($(this).html());
    $("#search_results #page-" + currentPage).show();
    showPagination();
    
    return false; /* Disable anchor-jump */
  });
  
  /* Jumper code */
  $("#search_results .pagination .jumper").keypress(function(e) {
    /* Only process Return (13) */
    if (e.keyCode != 13)
      return;
    
    var number = parseInt($(this).val());
    
    /* Opt out for invalid input */
    if (number < 1 || number > pages)
    {
      alert("Please choose a page between 1 and " + pages);
      return;
    }
    
    $("#search_results table").hide();
    currentPage = number;
    $("#search_results #page-" + currentPage).show();
    showPagination();
  });
  
  /* Jump to page clicked */
  $("#search_results .pagination submit.button").click(function() {
    e = jQuery.Event("keypress"); e.keyCode = 13;
    $("#search_results .pagination .jumper").trigger(e);
    return false;
  });
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

