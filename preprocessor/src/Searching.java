import java.util.HashMap;
import java.util.ArrayList;

import java.io.*;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;

import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;
import org.xml.sax.SAXException;

public class Searching {
  private HashMap<String, String> options;
  private HashMap<String, HashMap<String, HashMap<String, Integer>>> index;
  
  public Searching(HashMap <String, String> options) throws IOException {
    this.options = options;
    
    /* hash of: { word => { file => count }, ... }, per metadata */
    index = new HashMap<String, HashMap<String, HashMap<String, Integer>>>();
    index.put("__root__", new HashMap<String, HashMap<String, Integer>>());
    
    FilenameFilter filter = new FilenameFilter() {
      public boolean accept(File file, String name) {
        return name.endsWith(".metadata");
      }
    };
    
    File dir = new File(options.get("path"));
    String[] files = dir.list(filter);
    
    BufferedWriter list = new BufferedWriter(new FileWriter(options.get("site") + "indices/.list"));
    
    if (files == null) {
      System.err.println("no such file or directory " + options.get("path"));
    } else {
      for (int i = 0; i < files.length; i++) {
        list.write(i + ":" + files[i] + "\n");
        indexFile(files[i]);
      }
    }
    
    saveIndex();
    list.flush();
    list.close();
  }
  
  private boolean indexFile(String filename) {
    try {
      DocumentBuilderFactory dbf = DocumentBuilderFactory.newInstance();
      DocumentBuilder db = dbf.newDocumentBuilder();
    
      Document dom = db.parse(options.get("path") + filename);
      Element root = dom.getDocumentElement();
      
      NodeList nodeList = root.getChildNodes();
      for(int i = 0; i < nodeList.getLength(); i++) {
        Node childNode = nodeList.item(i);
        if (childNode.getNodeType() == 1) {
          /* ensure that the metadata field is in the index */
          String metafield = childNode.getNodeName().toLowerCase();
          if(!index.containsKey(metafield))
            index.put(metafield, new HashMap<String, HashMap<String, Integer>>());
          
          /* split by whitespace into an array of words */
          String[] words = childNode.getFirstChild().getNodeValue().replaceAll("[^\\d\\w]", " ").split("[\\s]");
          
          /* we now need to store that the current file contains the current word */
          for (String word : words) {
            /* disregard "stop" words */
            if (word.length() < 3)
              continue;
            
            /* downcase */
            word = word.toLowerCase();
            
            /* stem/canonicalize */
            Stemmer s = new Stemmer();
            s.add(word.toCharArray(), word.length());
            s.stem();
            word = s.toString();
            
            indexWord("__root__", word, filename);
            indexWord(metafield, word, filename);
          } /* for each word */
        }
      }
         
      return true;
    } catch (Exception e) {
      System.err.println("Unable to create index for \"" + filename + "\" -- " + e);
      e.printStackTrace();
      return false;
    }
  }
  
  public void indexWord(String metafield, String word, String filename) {
    HashMap<String, Integer> documentToCount;
    if(index.get(metafield).containsKey(word)) {
      documentToCount = index.get(metafield).get(word);
    } else {
      documentToCount = new HashMap<String, Integer>();
      index.get(metafield).put(word, documentToCount);
    }
    
    Integer count;
    if(documentToCount.containsKey(filename)) {
      count = documentToCount.get(filename);
    } else {
      count = Integer.valueOf(0);
    }
    count = Integer.valueOf(count.intValue() + 1);
    documentToCount.put(filename, count);
  }
  
  private void saveIndex() {
    for (String metafield : index.keySet()) {
      saveIndex(metafield);
    }
  }
  
  private void saveIndex(String metafield) {
    /* save to a file per word */
    for (String word : index.get(metafield).keySet()) {
      try {
        File _file = new File(options.get("site") + "indices/" + (metafield == "__root__" ? "" : metafield));
        _file.mkdirs();
        BufferedWriter file = new BufferedWriter(new FileWriter(_file + "/" + word));
        HashMap<String, Integer> documentToCount = index.get(metafield).get(word);
        for (String filename : documentToCount.keySet()) {
          file.write(filename + ":" + documentToCount.get(filename) + "\n");
        } /* for each file in which this word appears */
        file.flush();
        file.close();
      } catch (java.io.IOException IOERR) {
        System.err.println("Unable to save index for \"" + word + "\" -- " + IOERR);
      }
    } /* for each word */
  }
}
