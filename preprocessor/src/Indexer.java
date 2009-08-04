import java.util.HashMap;
import java.util.ArrayList;
import java.io.FileReader;
import java.io.BufferedReader;

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
    
    printIndex();
  }
  
  private boolean indexFile(String filename) {
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
  
  private void printIndex() {
    /* print out hash (in Ruby this would be `p index`) */
    for (String word : index.keySet()) {
      System.out.print(word + " => [");
      for (String filename : index.get(word)) {
        System.out.print(" " + filename);
      } /* for each file in which this word appears */
      System.out.println(" ]");
    } /* for each word */
  }
}
