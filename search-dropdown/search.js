import { fileReference } from "../base.js";

(() => {
  // urls for user selection options
  let urls = [];
  // list of available acronyms based on user selections
  let acronyms = [];

  // Search input box functionality
  // display the results of the search in the extension dropdown
  function display_results(event) { // Added event argument to fix potential reference error
    let numResults = 0;
    event.preventDefault();
    var resultsElem = document.getElementById("nrao_acro_results");
    resultsElem.innerHTML = "";
    var searchTerm = document.getElementById("nrao_acro_input").value;
    if (searchTerm && searchTerm.length > 1) {
      searchTerm = searchTerm.toUpperCase();

      for (var i = 0; i < acronyms.length; i++) {
        let a = acronyms[i].abbreviation;
        if (a.toUpperCase().includes(searchTerm)) {
          var node = document.createElement("li");
          var style = document.createElement("strong");
          var styleTextNode = document.createTextNode(acronyms[i].abbreviation);
          var textnode = document.createTextNode(`: ${acronyms[i].title} (${acronyms[i].category})`);
          var descnode = acronyms[i].description;
          node.title = descnode || "No details";
          style.appendChild(styleTextNode);
          node.appendChild(style);
          node.appendChild(textnode);
          resultsElem.appendChild(node);
          numResults++;
        }
      }
    } else {
      var node = document.createElement("li");
      var textnode = document.createTextNode(
        "Please enter 2 or more characters"
      );
      node.appendChild(textnode);
      resultsElem.appendChild(node);
      numResults++;
    }

    if (numResults < 1) {
      var node = document.createElement("li");
      var textnode = document.createTextNode("No Matches Found");
      node.appendChild(textnode);
      resultsElem.appendChild(node);
    }
  }

  document
    .getElementById("nrao_acro_submit")
    .addEventListener("click", display_results);

  // Get user settings
  chrome.storage.sync.get(
    {
      acronym_files: [],
    },
    function (items) {
      for (var index in items.acronym_files) {
        const result = fileReference.find(
          ({ ref }) => ref === items.acronym_files[index]
        );
        if (result && result.ref !== "default") {
          urls.push(result.url);
        }
      }

      let defaults = fileReference.filter(function (el) {
        return el.default === true;
      });
      for (var index in defaults) {
        if (
          defaults[index].ref !== "default" &&
          urls.indexOf(defaults[index].url) < 0
        ) {
          urls.push(defaults[index].url);
        }
      }
    }
  );

  /* MODIFIED FETCH ACRONYM LOGIC */
  const getAcronyms = async () => {
    try {
      // Find the local extension URL defined in your base.js fileReference
      const defaultReference = fileReference.find(({ ref }) => ref === "default");
      
      if (defaultReference && defaultReference.url) {
        const response = await fetch(defaultReference.url);
        acronyms = await response.json();
      }

      // Fetch any additional custom or fallback URLs stored in user settings
      for (var i = 0; i < urls.length; i++) {
        const response = await fetch(urls[i]);
        var tmpData = await response.json();
        acronyms = acronyms.concat(tmpData);
      }
    } catch (error) {
      console.error("Failed to load local or remote acronym assets:", error);
    }
    
    return acronyms;
  };

  getAcronyms();
})();
