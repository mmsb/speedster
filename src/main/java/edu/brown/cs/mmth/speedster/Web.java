package edu.brown.cs.mmth.speedster;

import java.io.File;
import java.io.IOException;
import java.io.PrintWriter;
import java.io.StringWriter;
import java.util.Map;

import com.google.common.collect.ImmutableMap;

import freemarker.template.Configuration;
import spark.ExceptionHandler;
import spark.ModelAndView;
import spark.QueryParamsMap;
import spark.Request;
import spark.Response;
import spark.Spark;
import spark.TemplateViewRoute;
import spark.template.freemarker.FreeMarkerEngine;

/**
 * Provides a launching mechanism for a web gui.
 */
public final class Web {

  private static final int INTERNAL_SERVER_ERROR = 500;
  private static final int PORT = 4567;

  private Web() { /* Constructor... defeated! */ }

  /**
   * Runs the spark server.
   */
  public static void runSparkServer() {
    Spark.externalStaticFileLocation("src/main/resources/static");
    Spark.exception(Exception.class, new ExceptionPrinter());

    FreeMarkerEngine freeMarker = createEngine();

    // Setup Spark Routes
    Spark.get("/home", new FrontHandler(), freeMarker);
    Spark.post("/allNotes", new ApiHandler.NoteMetaHandler());
    Spark.post("/words", new ApiHandler.SuggestionsHandler());
    Spark.post("/updateStyle", new ApiHandler.UpdateCSS());
    Spark.get("/getNote/:id", new ApiHandler.GetNote(), freeMarker);
    Spark.post("/getNextFlashcard", new ApiHandler.GetNextFlashCard());
    Spark.post("/finishedCard", new ApiHandler.UpdateFlashCard());
  }

  /** Returns a freeMakerEngine.
   * @return - A freeMakerEngine
   */
  private static FreeMarkerEngine createEngine() {
    Configuration config = new Configuration();
    File templates =
        new File("src/main/resources/spark/template/freemarker");
    try {
      config.setDirectoryForTemplateLoading(templates);
    } catch (IOException ioe) {
      System.out.printf("ERROR: Unable use %s for template loading",
          templates);
      System.exit(1);
    }
    return new FreeMarkerEngine(config);
  }

  /** Launches a site where you can query the baconGraph.
   * @author hsufi
   *
   */
  private static class FrontHandler implements TemplateViewRoute {
    @Override
    public ModelAndView handle(final Request req, final Response res) {
      Map<String, Object> variables =
          ImmutableMap.of(
              "title", "Maps");
      return new ModelAndView(variables, "map.ftl");
    }
  }

  /** Handles map requests.
   * @author hsufi
   *
   */
  private static class ResultsHandler implements TemplateViewRoute {
    @Override
    public ModelAndView handle(final Request req, final Response res) {
      QueryParamsMap qm = req.queryMap();
      Map<String, Object> variables =
          ImmutableMap.of(
              "title", "C32: Maps");
      return new ModelAndView(variables, "results.ftl");
    }
  }

  /** Prints out exceptions to the page.
   * @author hsufi
   *
   */
  private static class ExceptionPrinter implements ExceptionHandler {
    @Override
    public void handle(final Exception e, final Request req,
                       final Response res) {
      res.status(INTERNAL_SERVER_ERROR);
      StringWriter stacktrace = new StringWriter();
      try (PrintWriter pw = new PrintWriter(stacktrace)) {
        pw.println("<pre>");
        e.printStackTrace(pw);
        pw.println("</pre>");
      }
      res.body(stacktrace.toString());
    }
  }

}