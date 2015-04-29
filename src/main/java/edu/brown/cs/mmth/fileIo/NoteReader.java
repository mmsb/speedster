/**
 * See package-info.java file.
 */
package edu.brown.cs.mmth.fileIo;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.Collection;

import edu.brown.cs.mmth.speedster.Main;
import edu.brown.cs.mmth.speedster.Note;

import org.json.JSONException;
import org.json.JSONObject;

/**
 * Reads all the notes within a given directory into Note objects.
 *
 * @author tbhargav
 *
 */
public class NoteReader {

  /**
   * Reads note files in a given path into our 'Note' object.
   * @param id - The id of the subject whose notes you want.
   * @return collection of note. In case of error return null.
   */
  public static Collection<Note> readNotes(final long subjectId) {
    // Creating a file with the given path.
    String basePath = Main.getBasePath();
    File folder = new File(basePath + "/" + subjectId);

    // Reading all notes in path.
    Collection<Note> notes = new ArrayList<Note>();

    if (folder.listFiles() != null) {
      for (File noteFolder : folder.listFiles()) {
        //fileEntry is the folder for a note
        File[] noteFiles = noteFolder.listFiles();
        if (noteFiles == null || noteFiles.length == 0) {
          continue;
        }
        for (File fileEntry : noteFiles) {
       // Making sure we're only reading notes and not flashcards/directories.
          if (fileEntry.isFile() && fileEntry.getName().charAt(0) == 'N') {

            // Reading data from this file into string.
            StringBuilder json = new StringBuilder();
            try (
                BufferedReader br =
                new BufferedReader(new InputStreamReader(new FileInputStream(
                    fileEntry), "UTF-8"))) {
              String line;
              while ((line = br.readLine()) != null) {
                json.append(line);
              }
            } catch (Exception e) {
              return null;
            }
            // Converting retrieved data into note object.
            long id = 0;
            try {
              id = Long.parseLong(fileEntry.getName().substring(1));
            } catch (NumberFormatException e) {
              // The file is invalid so we skip it.
              continue;
            }
            Note note = new Note("", -1L, "");
            String jsonData = json.toString();
            if (jsonData.isEmpty()) {
              continue; //File has no data
            } else {
              try {
                new JSONObject(jsonData);
              } catch (JSONException e) {
                continue; //File isn't a proper JSON object.
              }
            }
            note.updateFields(jsonData);
            note.setId(id);
            notes.add(note);
          }
        }
        
      }
    }
    return notes;
  }
  
  /** Grabs the ID associated with the Subject.
   * @param subject - The subject nameof the note.
   * @return - The ID of the subject, returns -1 on error.
   */
  public static String getNoteSubjectName(long idL) {
    File file = new File(Main.getBasePath() + "/" + idL + "/title");
    if (!file.isFile()) {
      return "";
    }
    try (
        BufferedReader br =
        new BufferedReader(new InputStreamReader(new FileInputStream(
            file), "UTF-8"))) {
      String name = br.readLine();
      return name;
    } catch (IOException e) {
      System.err.println("ERROR in getNoteSubject:" + e.getMessage());
      return "";
    }
  }

  protected NoteReader() {
    throw new UnsupportedOperationException();
  }

}
