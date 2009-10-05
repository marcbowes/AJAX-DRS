import java.io.*;
import java.util.HashMap;
import java.util.Vector;

import javax.xml.parsers.*;
import org.w3c.dom.*;
import org.xml.sax.*;

/*
 * Preprocessor class
 * [done] Reads the src directory for a list of files and their associated metadata's
 * [done] Parses those metadata files into data structures.
 * [done] Sorts the arrays
 * [done] Writes the arrays out as lists of xml files to be used by the website.
 * 
 * 2nd Iteration
 * [done] Read in config file
 * [done] Parse options from the config file
 * [done] Write version and representation into variables for the site
 * [done] Interpret and use representation
 */


public class Preprocessor{
	public static void main (String [] args) throws IOException
	{
		new Preprocessor();		
	}
	
	private static final int RECORDS_PER_FILE = 5;
	private Vector <Meta> files;
	private HashMap <String,Vector<Meta>> sortedLists;
	private HashMap <String,String> options;
	
	public Preprocessor() throws IOException{
		options = new HashMap <String, String>();
		parseOptions();
		System.out.println("Begin");
		files = new Vector<Meta>();
		sortedLists = new HashMap <String,Vector<Meta>>();
		readMetaFiles(options.get("path"));
		sortMetaFiles();
		writeSortedFiles();
		System.out.println("End");
	}
	
	/*
	 * Method to parse the options from the config file into a hash map.
	 * Sets default values if they are not specified for site, path, and representation.
	 *
	 */
	private void parseOptions(){
		try{
			File optionFile = new File("config.cfg");
			BufferedReader reader = new BufferedReader(new FileReader(optionFile));	
			String line = null;
			//Go through options file reading in options.
			while((line=reader.readLine()) != null){
				if(line.startsWith("#") || line.length() <= 0){
					continue;
				}else{
					String delims = "[ ]+";
					String [] tokens = line.split(delims);
					options.put(tokens[0], tokens[1]);
				}
			}
			//Set some defaults if they are not present.
			if(!options.containsKey("path")){
				options.put("path", "../site/data/");
			}
			if(!options.containsKey("representation")){
				options.put("representation", "title");
			}
			if(!options.containsKey("site")){
				options.put("site", "../site/");
			}
		}catch(FileNotFoundException e){
			System.err.println("Could not find the config.cfg file");
		}catch(IOException e){
			System.err.println("Caught IOException: " + e.getMessage());
		}
	}
	
	/*
	 * Method to read in data from metadata files in the
	 * directory specified by p.
	 * 
	 * Puts the information stored int the xml metadata files
	 * into a vector of Meta files.
	 */
	private void readMetaFiles(String p) {
		String path = p;
		File dir = new File(path);				
		File[] list = dir.listFiles();
		if(list != null){
			for (int i = 0; i < list.length; i++)  {
				if(list[i].isFile()){
					//UGLY IF, Checks for metadata files and that the metadata file has a src file.
					if(list[i].getName().endsWith(".metadata") && search(list,list[i].getName().substring(0,list[i].getName().length() - ".metadata".length()))){
						Document doc = parseXmlFile(list[i].getAbsolutePath(), false);
						Node root = doc.getFirstChild();
					
						NodeList nodes = root.getChildNodes();
						HashMap<String,String> m = new HashMap<String,String>();
						//Goes through the child nodes accessing the nodes of type 1.
						//Reads The name of the node aswell as the value
						for(int j = 0; j < nodes.getLength(); j++){
							Node n = nodes.item(j);
							if(n.getNodeType() == 1){	
								if(n.getFirstChild().getNodeValue().trim().length() > 0){					
									m.put(n.getNodeName(), n.getFirstChild().getNodeValue());
								}
							
							}
						}
						/*
						 * TODO Make the program read in a template plugin for creating the representation, "Temp" for now.
						 */
						String rep = "";
						String [] parts = options.get("representation").split(",");
						for(int j = 0; j < parts.length; j++){
							if(m.containsKey(parts[j])){
								rep += m.get(parts[j]);
								if(!(j == parts.length-1)){
									rep += ", ";
								}
							}
						} 					
						if(rep.endsWith(", ")){
							rep = rep.substring(0,rep.length()-2);
						}
						Meta file = new Meta(list[i].getPath().substring((options.get("site") + "data/").length(),list[i].getPath().length()),m,rep);
						files.add(file);
					}//end ugly if
				}else if(list[i].isDirectory()){
					readMetaFiles(list[i].getPath());
				}
			}//end For
		}		
	}//readMetaFiles

	/*
	 * Method to sort the metadata files.
	 * Sorts all the files in the files vector
	 * into a set of lists in the HashMap sortedLists.
	 * 
	 * The sortedLists hashmap has keys -> sorted list of files
	 * 
	 * Uses the insertSorted method to perform an insertion sort.
	 */
	private void sortMetaFiles() {
		// TODO Sort files into sortedLists
		//Simple insertion sort to build up lists
		for(int i = 0; i < files.size(); i++){
			for ( String key : files.elementAt(i).meta.keySet() ){
				if(sortedLists.containsKey(key)){
					insertSorted(sortedLists.get(key), files.elementAt(i), key);
				}else{
					Vector<Meta> vec = new Vector<Meta>();
					vec.add(files.elementAt(i));
					sortedLists.put(key,vec);
				}
			}
		}
		
	}

	private void insertSorted(Vector<Meta> vector, Meta element, String key) {
		// TODO Auto-generated method stub
		boolean inserted = false;
		for(int i = 0; i < vector.size(); i++){
			if(vector.elementAt(i).meta.get(key).compareTo(element.meta.get(key)) > 0){
				vector.insertElementAt(element, i);
				inserted = true;
				break;
			}
		}
		if(inserted == false){
			vector.add(element);
		}
	}
	
	/*
	 * Method to write out the sorted lists to files, aswell as
	 * creating a .js file the website can include to know what files
	 * to include.
	 */
	private void writeSortedFiles() throws IOException {
		// TODO Write sortedLists to files to be read by AJAX website.
		File importFile = new File(options.get("site") + "javascripts/meta.js");
		BufferedWriter writer1 = new BufferedWriter(new FileWriter(importFile));
		writer1.write("var files = new Array();");
		writer1.newLine();		
		for( String key : sortedLists.keySet()){
		    int filenum = 0;
			System.out.println("Writing \"" + key + "\" file " + filenum);
			writer1.write("var " + key + " = new Array();\n");
			writer1.write(key+"[" + filenum + "] = \"" + key + filenum + "\";\n");
			File outFile = new File(options.get("site") + "lists/" + key + filenum);
			BufferedWriter writer = new BufferedWriter(new FileWriter(outFile));
			for(int i = 0; i < sortedLists.get(key).size(); i++){
				/*
				 * TODO : Count to 20 or so, then move into next file!
				 */
				//System.out.println(i - filenum*RECORDS_PER_FILE);
				if((i - filenum*RECORDS_PER_FILE + 1) > RECORDS_PER_FILE){
					filenum++;
					writer.close();
					outFile = new File(options.get("site") + "lists/" + key + filenum);
					writer = new BufferedWriter(new FileWriter(outFile));
					System.out.println("Writing \"" + key + "\" file " + filenum);
					writer1.write(key+"[" + filenum + "] = \"" + key + filenum + "\";\n");
				}
				writer.write(sortedLists.get(key).elementAt(i).name + ";" + sortedLists.get(key).elementAt(i).representation + ";" + sortedLists.get(key).elementAt(i).meta.get(key));
				writer.write("\n");
			}
			writer.close();
			writer1.write("files[\""+ key + "\"] = " + key + ";\n");
			System.out.println("\tdone.");
		}
		writer1.write("var version = " + options.get("version") + ";\n");
		writer1.write("var representation = \"" + options.get("representation") + "\";\n");
		writer1.write("var pageSize = " + RECORDS_PER_FILE + ";\n");
		writer1.close();
		
	}

	/*
	 Stuff to read files that I took out for now.
	 
	 File outFile = new File("/Users/SixiS/workspace/uct/Project/meta.js");
	 BufferedWriter writer = new BufferedWriter(new FileWriter(outFile));
	 writer.write("var files=new Array();");
	 writer.newLine();
	 
	 */
	

	/*
	 * Method to parse and XML file into a Document.
	 * Used by the readMetaFils method
	 */
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

	/*
	 * Simple method to see if an array contains specified key...
	 * CANT BELIEVE JAVA DOESNT HAVE THIS :C
	 */
	public static boolean search(File [] a, String key){
		boolean found = false;
		for(int i = 0; i < a.length; i++){
			if(a[i].getName().equalsIgnoreCase(key)){
				found = true;
			}
		}
		return found;
	}

}