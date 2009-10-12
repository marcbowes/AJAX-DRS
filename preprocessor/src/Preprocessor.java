import java.io.*;
import java.util.HashMap;

import javax.xml.parsers.*;
import org.w3c.dom.*;
import org.xml.sax.*;

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
		try{
			Document doc = parseXmlFile("config.xml", false);
			Node root = doc.getFirstChild();

			NodeList nodes = root.getChildNodes();
			for(int j = 0; j < nodes.getLength(); j++){
				Node n = nodes.item(j);
				if(n.getNodeType() == 1){	
					if(n.getFirstChild().getNodeValue().trim().length() > 0){					
						options.put(n.getNodeName(), n.getFirstChild().getNodeValue());
						//System.out.println(n.getNodeName() + " : " + n.getFirstChild().getNodeValue());
					}			
				}
			}
		}catch(Exception e){
			System.err.println(e);
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
			
			if (!options.containsKey("items_per_page")) {
				options.put("items_per_page", "5");
			}
		}
}

public static Document parseXmlFile(String filename, boolean validating) {
	try {
		// Create a builder factory
		DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
		factory.setValidating(validating);

		// Create the builder and parse the file
		Document doc = factory.newDocumentBuilder().parse(new File(filename));
		return doc;
	} catch (SAXException e) {
		// A parsing error occurred; the xml input is not valid
	} catch (ParserConfigurationException e) {
	} catch (IOException e) {
	}
	return null;
}
}