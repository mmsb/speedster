package edu.brown.cs.mmth.speedster;


import java.io.IOException;
import java.util.Collection;
import java.util.List;
import java.util.Map;

import com.google.common.collect.ImmutableMap;
import com.google.gson.Gson;

import edu.brown.cs.mmth.fileIo.CSSSheetMaker;
import edu.brown.cs.mmth.fileIo.NoteReader;
import edu.brown.cs.tbhargav.tries.Word;

import spark.ModelAndView;
import spark.QueryParamsMap;
import spark.Request;
import spark.Response;
import spark.Route;
import spark.TemplateViewRoute;

/**
 * Handles the ajax requests sent by the front end.
 *
 * @author hsufi
 *
 */
public final class ApiHandler {

  /**
   * Gson object to make things into JSON.
   */
  private static final Gson gson = new Gson();

  /**
   * Private Constructor.
   */
  private ApiHandler() {
  }

  /** Loads metadata associated with all notes.
   * @author hsufi
   *
   */
  public static class NoteMetaHandler implements Route {
    @Override
    public Object handle(final Request req, final Response res) {
      // Grab metadata from notes, return info as JSON.
      String toReturn = "";
      return toReturn;
    }
  }

  /**
   * Handles updating notes per folder when new notes are added by the
   * user on the main page.
   * @author sm15
   */
  public static class UpdateNotes implements Route {
    @Override
    public Object handle(final Request req, final Response res) {
      QueryParamsMap qm = req.queryMap();
      String notes = qm.value("notes");


      // #TODO: response if any!
      Map<String, Object> variables =
              ImmutableMap.of(
                      "title", "Welcome home");
      return new ModelAndView(variables, "main.ftl");
    }
  }

  /** Generates autocorrect suggestions for the given word.
   * @author tbhargav
   *
   */
  public static class SuggestionsHandler implements Route {
    @Override
    public Object handle(final Request req, final Response res) {
      // Helps get content from 'form'
      QueryParamsMap qm = req.queryMap();
      String inputText = qm.value("text_box");

      // String parsing to get neat suggestions.
      String sansPunct = edu.brown.cs.tbhargav.autocorrect.Main
          .stripPunctuation(inputText);
      String[] arr = sansPunct.split(" ");
      String word = arr[arr.length - 1];
      String prevWord = "";
      StringBuilder withoutWord = new StringBuilder();
      for (int i = 0; i < arr.length - 1; i++) {
        if (!arr[i].trim().equalsIgnoreCase("")) {
          withoutWord.append(arr[i].trim() + " ");
        }
      }

      if (!withoutWord.toString().isEmpty()) {
        prevWord = withoutWord.toString().split(" ")[withoutWord.toString()
                                                     .split(" ").length - 1];
      }

      List<Word> suggs = edu.brown.cs.tbhargav.autocorrect.Main
          .suggGenAndRanker(
              edu.brown.cs.tbhargav.autocorrect.Main.getGlobalTrie(), word,
              prevWord);

      // Combining the 5 (punctuation free suggestions
      // into a big '.' separated string
      StringBuilder sb = new StringBuilder("");
      for (int i = 0; i < suggs.size(); i++) {
        Word w = suggs.get(i);
        sb.append(withoutWord + w.getStringText());
        if (i == suggs.size() - 1) {
          continue;
        }
        sb.append('.');
      }

      // Adding suggestions in manually!
      Map<String, Object> variables;

      variables = ImmutableMap.of("title", "Hollywood Connections", "message",
          " ", "orig", inputText, "suggs", sb.toString());

      return gson.toJson(variables);

    }
  }

  /** Loads the note given by the id and then runs that
   *  note on it's own page.
   * @author hsufi
   *
   */
  public static class GetNote implements TemplateViewRoute  {
    @Override
    public ModelAndView handle(final Request req, final Response res) {
      QueryParamsMap qm = req.queryMap();
      int id;
      try {
        id = Integer.parseInt(req.params(":id"));
      } catch (NumberFormatException e) {
        Map<String, Object> variables =
            ImmutableMap.of(
                    "title", "Speedster",
                    "error", e.getMessage());
            return new ModelAndView(variables, "note.ftl");
      }
      String subject = req.params("subject");
      Collection<Note> notes = NoteReader.readNotes(subject);
      Note returnNote = null;
      for (Note note: notes) {
        if (note.getId() == id) {
          returnNote = note;
          break;
        }
      }
      Map<String, Object> variables;
      if (returnNote != null) {
        variables =
            ImmutableMap.of(
                "title", "Speedster",
                "node", returnNote.getTextData());
      } else {
        variables =
            ImmutableMap.of(
                "title", "Speedster",
                "node", "");
      }
      return new ModelAndView(variables, "note.ftl");
    }
  }

  /** Updates the stylesheet of the current subject
   *  with the given rules.
   * @author hsufi
   *
   */
  public static class UpdateCSS implements Route {
    @Override
    public Object handle(final Request req, final Response res) {
      QueryParamsMap qm = req.queryMap();
      String cssFile = qm.value("css");
      String subject = qm.value("subject");
      Boolean success = false;
      try {
        success = CSSSheetMaker.writeCSSToFile(cssFile, subject);
      } catch (IOException e) {
        System.err.println("ERROR: CSS error " + e.getMessage());
        //return JSON with error message.
      }
      String toReturn = "";
      return toReturn;
    }
  }

  /** Grabs the next flash card to display to the user
   * based on the data from each flashcard.
   * @author hsufi
   *
   */
  public static class GetNextFlashCard implements Route {
    @Override
    public Object handle(final Request req, final Response res) {
      QueryParamsMap qm = req.queryMap();
      // Grab request specifics from the map
      String toReturn = "";
      return toReturn;
    }
  }

  /** Updates the meta-data of the given flashcard, such as
   *  adding to the number of right and wrongs as well as updating
   *  the time stamp of the flashcard.
   * @author hsufi
   *
   */
  public static class UpdateFlashCard implements Route {
    @Override
    public Object handle(final Request req, final Response res) {
      QueryParamsMap qm = req.queryMap();
      // Grab request specifics from the map
      String toReturn = "";
      return toReturn;
    }
  }
}
