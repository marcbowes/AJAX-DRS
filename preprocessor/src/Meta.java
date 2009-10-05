import java.util.HashMap;

public class Meta {
	public String name = "", representation = "";
	public HashMap<String, String> meta;
	public Meta(String n, HashMap<String, String> m, String r){
		name = n;
		meta = m;
		representation = r;
	}
}
