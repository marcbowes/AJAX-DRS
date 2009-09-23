import java.util.HashMap;
import java.util.ArrayList;

import java.io.File;
import java.io.FilenameFilter;

import java.io.FileReader;
import java.io.BufferedReader;

import java.io.FileWriter;
import java.io.BufferedWriter;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;

import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;
import org.xml.sax.SAXException;

public class Indexer {
  public static void main(String[] args) {
    new Indexer();
  }
  
  private HashMap<String, HashMap<String, HashMap<String, Integer>>> index;
  
  public Indexer() {
    /* hash of: { word => { file => count }, ... }, per metadata */
    index = new HashMap<String, HashMap<String, HashMap<String, Integer>>>();
    index.put("__root__", new HashMap<String, HashMap<String, Integer>>());
    
    FilenameFilter filter = new FilenameFilter() {
      public boolean accept(File file, String name) {
        return name.endsWith(".metadata");
      }
    };
    
    File dir = new File("../data");
    String[] files = dir.list(filter);
    
    if (files == null) {
      System.err.println("no such file or directory ../data");
    } else {
      for (int i = 0; i < files.length; i++) {
        indexFile(files[i]);
      }
    }
    
    saveIndex();
  }
  
  private boolean indexFile(String filename) {
    try {
      DocumentBuilderFactory dbf = DocumentBuilderFactory.newInstance();
      DocumentBuilder db = dbf.newDocumentBuilder();
    
      Document dom = db.parse("../data/" + filename);
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
          String[] words = childNode.getFirstChild().getNodeValue().split("[\\s-/]");
          
          /* we now need to store that the current file contains the current word */
          for (String word : words) {
            /* remove non alpha-numeric */
            word = word.replaceAll("[^\\d\\w]", "");
            
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
            
            HashMap<String, Integer> documentToCount;
            if(index.get("__root__").containsKey(word)) {
              documentToCount = index.get("__root__").get(word);
            } else {
              documentToCount = new HashMap<String, Integer>();
              index.get("__root__").put(word, documentToCount);
            }
            
            Integer count;
            if(documentToCount.containsKey(filename)) {
              count = documentToCount.get(filename);
            } else {
              count = Integer.valueOf(0);
            }
            count = Integer.valueOf(count.intValue() + 1);
            documentToCount.put(filename, count);
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
  
  private void saveIndex() {
    /* save to a file per word */
    for (String word : index.get("__root__").keySet()) {
      try {
        BufferedWriter file = new BufferedWriter(new FileWriter("../site/indices/" + word));
        HashMap<String, Integer> documentToCount = index.get("__root__").get(word);
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
