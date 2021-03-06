import java.util.HashMap;
import java.util.ArrayList;
import java.util.List;

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
  private BufferedWriter ids;
  
  public Searching(HashMap <String, String> options) throws IOException {
    this.options = options;
    
    /* hash of: { word => { file => count }, ... }, per metadata */
    index = new HashMap<String, HashMap<String, HashMap<String, Integer>>>();
    index.put("__root__", new HashMap<String, HashMap<String, Integer>>());
    
    List<File> files = FileListing.getFileListing(new File(options.get("path")));
    
    File _file = new File(options.get("site") + "lists");
    _file.mkdirs();
    ids = new BufferedWriter(new FileWriter(_file + "/identifiers"));
    BufferedWriter idx = new BufferedWriter(new FileWriter(_file + "/indices"));
    
    if (files == null) {
      System.err.println("no such file or directory " + options.get("path"));
    } else {
      int i = 0;
      for (File file : files) {
        if (!file.getName().endsWith(".metadata"))
          continue;
        
        i++;
        ids.write(i + ":" + file.getName() + ":");
        indexFile(file, i);
      }
    }
    
    saveIndex();
    
    for (String word : index.get("__root__").keySet()) {
      idx.write(word + "\n");
    }
    
    ids.flush();
    ids.close();
    idx.flush();
    idx.close();
  }
  
  private boolean indexFile(File file, int id) {
    String filename = file.getName();
    
    try {
      DocumentBuilderFactory dbf = DocumentBuilderFactory.newInstance();
      DocumentBuilder db = dbf.newDocumentBuilder();
      
      Document dom = db.parse(file.getAbsolutePath());
      Element root = dom.getDocumentElement();
      
      NodeList nodeList = root.getChildNodes();
      
      /* accumulate words for document length */
      HashMap<String, Integer> accumulater = new HashMap<String, Integer>();
      
      for(int i = 0; i < nodeList.getLength(); i++) {
        Node childNode = nodeList.item(i);
        if (childNode.getNodeType() == 1) {
          /* ensure that the metadata field is in the index */
          String metafield = childNode.getNodeName().toLowerCase();
          if(!index.containsKey(metafield))
            index.put(metafield, new HashMap<String, HashMap<String, Integer>>());
          
          /* split by whitespace into an array of words */
          if (childNode.getFirstChild() == null)
            continue;
          
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
            
            /* index */
            indexWord("__root__", word, id);
            indexWord(metafield, word, id);
            
            /* accumulate */
            Integer accumulation;
            if(accumulater.containsKey(word)) {
              accumulation = accumulater.get(word);
            } else {
              accumulation = Integer.valueOf(0);
            }
            accumulater.put(word, Integer.valueOf(accumulation.intValue() + 1));
          } /* for each word */
        }
      }
      
      int length = 0;
      for (Integer accumulation : accumulater.values()) {
        length += Math.pow(accumulation.intValue(), 2);
      }
      ids.write(length + ":" + file.getAbsolutePath() + "\n");
      return true;
    } catch (Exception e) {
      System.err.println("Unable to create index for \"" + filename + "\" -- " + e);
      e.printStackTrace();
      return false;
    }
  }
  
  public void indexWord(String metafield, String word, int id) {
    HashMap<String, Integer> documentToCount;
    if(index.get(metafield).containsKey(word)) {
      documentToCount = index.get(metafield).get(word);
    } else {
      documentToCount = new HashMap<String, Integer>();
      index.get(metafield).put(word, documentToCount);
    }
    
    Integer count;
    if(documentToCount.containsKey(id + "")) {
      count = documentToCount.get(id + "");
    } else {
      count = Integer.valueOf(0);
    }
    count = Integer.valueOf(count.intValue() + 1);
    documentToCount.put(id + "", count);
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
        BufferedWriter file = new BufferedWriter(new FileWriter(_file + "/" + word + ".idx"));
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
