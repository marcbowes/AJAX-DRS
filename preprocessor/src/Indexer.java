import java.util.HashMap;
import java.util.ArrayList;

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
  
  private HashMap<String, ArrayList<String>> index;
  
  public Indexer() {
    /* hash of: { word => [files, in, which, it, appears], ... } */
    index = new HashMap<String, ArrayList<String>>();
    
    /* filenames to load, typically would be an entire directory? */
    String[] filenames = { "sample.txt", "sample2.txt" };
    
    /* process each file */
    for (String filename : filenames) {
      indexFile(filename);
    } /* for each file */
    
    saveIndex();
  }
  
  private boolean indexFile(String filename) {
    try {
      DocumentBuilderFactory dbf = DocumentBuilderFactory.newInstance();
      DocumentBuilder db = dbf.newDocumentBuilder();
    
      Document dom = db.parse(filename);
      Element root = dom.getDocumentElement();
      
      NodeList nodeList = root.getChildNodes();
      for(int i = 0; i < nodeList.getLength(); i++) {
        Node childNode = nodeList.item(i);
        if (childNode.getNodeType() == 1) {
            /* split by whitespace into an array of words */
          String[] words = childNode.getFirstChild().getNodeValue().split("\\s");
          
          /* we now need to store that the current file contains the current word */
          for (String word : words) {
            /* either load or create list */
            ArrayList<String> list;         
            if (index.containsKey(word)) {
              list = index.get(word);
            } else {
              list = new ArrayList<String>();
              index.put(word, list);
            }
            
            /* blindly add filename FIXME: check duplicates */
            list.add(filename);
          } /* for each word */
        }
      }
         
      return true;
    } catch (Exception e) {
      return false;
    }
  }
  
  private boolean indexFile__(String filename) {
    try {
      /* load the file, and read each line */
      BufferedReader file = new BufferedReader(new FileReader(filename));    
      String line;
      while ((line = file.readLine()) != null) {
        /* split this line by whitespace into an array fo words */
        String[] words = line.split("\\s");
        
        /* we now need to store that the current file contains the current word */
        for (String word : words) {
          /* either load or create list */
          ArrayList<String> list;         
          if (index.containsKey(word)) {
            list = index.get(word);
          } else {
            list = new ArrayList<String>();
            index.put(word, list);
          }
          
          /* blindly add filename FIXME: check duplicates */
          list.add(filename);
        } /* for each word in the line */
      } /* for each line in the file */
    } catch (java.io.FileNotFoundException ENOENT) {
      return false;
    } catch (java.io.IOException IOERR) {
      return false;
    }
    
    return true;
  }
  
  private void saveIndex() {
    /* save to a file per word */
    for (String word : index.keySet()) {
      try {
        BufferedWriter file = new BufferedWriter(new FileWriter(word));
        for (String filename : index.get(word)) {
          file.write(filename + "\n");
        } /* for each file in which this word appears */
        file.flush();
        file.close();
      } catch (java.io.IOException IOERR) {
        System.err.println("Unable to save index for \"" + word + "\" -- " + IOERR);
      }
    } /* for each word */
  }
}
