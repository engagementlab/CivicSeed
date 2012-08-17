/*in order to run this file you need:

	Processing!
	json library for processing (https://github.com/agoransson/JSON-processing)
	

*/
import org.json.*;
import java.io.File;

int numberOfTiles = 22500;
int numRows = 15;
int numCols = 30;
int xTiles = 150;
int yTiles = 150;

void setup(){

	JSONArray allQuads = new JSONArray();
	
	for(int x=0;x<5;x)	
	boolean isWorldEdge;
	
	if(worldX == 0 || worldY ==0 || worldX == xTiles-1 || worldY==yTiles-1){
		isWorldEdge = true;
	}
	else{
		isWorldEdge = false;
	}
				
	

				//tile will have more things, color (with hsb), owner,etc
				JSONObject tile = new JSONObject();
				tile.put("x", worldX);
				tile.put("y", worldY);
	
				tile.put("nogo",no);
				tile.put("isQuadEdge",isQuadEdge);
				tile.put("isWorldEdge",isWorldEdge);

				tiles.put(tile);

				//put the tile array into the world object
				//world.put("tiles",tiles);
				
			}


			//create the file for the quadrant
			File file = new File(dataPath("/data/") + File.separator + "world.json");
			// Create the data directory if it does not exist
			//file.getParentFile().mkdirs();  
			try{
				// If the file already exists, it will be overwritten
				FileWriter fstream = new FileWriter(file, false);
				// Use this instead if you want to append the data to the file
				//FileWriter fstream = new FileWriter(file, true);    
				BufferedWriter out = new BufferedWriter(fstream);
				// do the actual writing
				tiles.write(out);
				// Close the stream
				out.close();
			}
			catch (Exception e){
				System.err.println("Error writing the JSON file: " + e.getMessage());
			} 
		
	

}

void draw(){
}