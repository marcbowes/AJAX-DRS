import java.io.*;
import java.util.HashMap;

public class Preprocessor {
  private static HashMap<String, String> options;
  
  public static void main(String[] args) throws IOException {
    parseOptions();
    new Searching(options);
    new Browsing(options);
  }
  
  /*
	 * Method to parse the options from the config file into a hash map.
	 * Sets default values if they are not specified for site, path, and representation.
	 *
	 */
	private static void parseOptions() {
	  options = new HashMap<String, String>();
	  
		try {
			File optionFile = new File("config.cfg");
			BufferedReader reader = new BufferedReader(new FileReader(optionFile));	
			String line = null;
			//Go through options file reading in options.
			while ((line=reader.readLine()) != null) {
				if (line.startsWith("#") || line.length() <= 0) {
					continue;
				} else {
					String delims = "[ ]+";
					String [] tokens = line.split(delims);
					options.put(tokens[0], tokens[1]);
				}
			}
    } catch (FileNotFoundException e) {
			System.err.println("Could not find the config.cfg file");
		} catch (IOException e) {
			System.err.println("Caught IOException: " + e.getMessage());
		} finally {
		  /* DEFAULT OPTIONS */
			
			if(!options.containsKey("path")) {
				options.put("path", "../site/data/");
			}
			
			if (!options.containsKey("representation")) {
				options.put("representation", "title");
			}
			
			if (!options.containsKey("site")) {
				options.put("site", "../site/");
			}
		}
	}
}
