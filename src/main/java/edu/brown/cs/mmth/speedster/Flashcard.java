/**
 * See pckg-info.
 */
package edu.brown.cs.mmth.speedster;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.concurrent.TimeUnit;

import org.json.JSONObject;

import edu.brown.cs.mmth.fileIo.Readable;
import edu.brown.cs.mmth.fileIo.Writeable;

/**
 * This card models a flashcard. It stores all associated data and allows direct
 * file IO. It also has the method
 *
 * @author tbhargav
 *
 */
public class Flashcard implements Readable, Writeable {

  private static final int PERCENT = 100;
  private static final int RANKVAL = 10;

  /**
   * Computes a universal flashcard rank based on given data.
   *
   * @param numDays
   *          -The number of days since the flash card was last reviewed.
   * @param noCorrect
   *          - (no. of times user got card right)
   * @param noWrong
   *          - (no. of times user got card wrong)
   * @return integer rank of flashcard
   */
  public static int computeFlashcardRank(final int numDays,
      final int noCorrect, final int noWrong) {
    int dayWeight = numDays * RANKVAL;
    double ratio;

    // Getting one card correct once is the same as getting it correct none
    // (small edge case).
    if (noCorrect == 0) {
      ratio = noWrong * PERCENT;
    } else {
      ratio = noWrong / (double) noCorrect * PERCENT;
    }

    int rank = (int) (dayWeight + ratio);
    return rank;
  }

  /**
   * The rank of the flash card.
   */
  private int rank;
  /**
   * The subject that Flashcard belongs to.
   */
  private String subjectName;
  /**
   * The ID of the associated note.
   */
  private long noteId;
  /**
   * The id of the Flashcard.
   */
  private long id;
  /**
   * The number of times this user got this flash card correct.
   */
  private int numberTimesCorrect;
  /**
   * The number of times this user got this flash card wrong.
   */
  private int numberTimesWrong;
  /**
   * The question to display.
   */
  private String question;

  /**
   * The answer to the question.
   */
  private String answer;

  /**
   * The day the card was last used.
   */
  private Date lastUse;

  /**
   * Flash cards should only be displayed once per session.
   */
  private boolean displayForThisSession;

  /**
   * Constructs a new flash card.
   *
   * @param answer
   *          - The answer of the card.
   * @param question
   *          - The question of the flashcard.
   */
  public Flashcard(final String answer, final String question) {
    numberTimesCorrect = 0;
    numberTimesWrong = 0;
    this.answer = answer;
    this.question = question;
    lastUse = new Date(Instant.now().toEpochMilli());
  }

  @Override
  public boolean equals(final Object obj) {
    if (!(obj instanceof Flashcard)) {
      return false;
    }

    Flashcard otherCard = (Flashcard) obj;
    return id == otherCard.id;
  }

  /**
   * Accessor for answer.
   *
   * @return the answer
   */
  public String getAnswer() {
    return answer;
  }

  @Override
  public List<String> getDataToStore() {
    List<String> toReturn = new ArrayList<>();
    toReturn.add("rank:" + Long.toString(rank));
    toReturn.add("subjectName:" + subjectName);
    toReturn.add("noteId:" + noteId);
    toReturn.add("ntc:" + Integer.toString(numberTimesCorrect));
    toReturn.add("ntw:" + Integer.toString(numberTimesWrong));
    toReturn.add("question:" + question);
    toReturn.add("answer:" + answer);
    toReturn.add("lastUse:" + Long.toString(lastUse.getTime()));
    return toReturn;
  }

  /**
   * Given a JSON object that has the fields, will update each field of the
   * FlashCard. - The FlashCard as JSON.
   * @param json the json to update the fields with.
   */
  @Override
  public void updateFields(final String json) {
    JSONObject object = new JSONObject(json);
    rank = Integer.parseInt(object.getString("rank"));
    subjectName = object.getString("subjectName");
    noteId = Long.parseLong(object.getString("noteId"));
    numberTimesCorrect = Integer.parseInt(object.getString("ntc"));
    numberTimesWrong = Integer.parseInt(object.getString("ntw"));
    question = object.getString("question");
    answer = object.getString("answer");
    lastUse = new Date(Long.parseLong(object.getString("lastUse")));
  }

  /**
   * Grabs the number of days since last use.
   *
   * @return - The number of days since last use
   */
  public long getElapsedDays() {
    Date now = new Date(System.currentTimeMillis());
    long diffMili = now.getTime() - lastUse.getTime();
    return TimeUnit.DAYS.convert(diffMili, TimeUnit.MILLISECONDS);
  }

  @Override
  public long getId() {
    return id;
  }

  /**
   * Accessor for lastUse.
   *
   * @return the lastUse
   */
  public Date getLastUse() {
    return new Date(lastUse.getTime());
  }

  /**
   * Updates last use to the current date.
   */
  public void updateLastUse() {
    lastUse = new Date(Instant.now().toEpochMilli());
  }

  /**
   * Accessor for numberTimesCorrect.
   *
   * @return the numberTimesCorrect
   */
  public int getNumberTimesCorrect() {
    return numberTimesCorrect;
  }

  /**
   * Accessor for numberTimesWrong.
   *
   * @return the numberTimesWrong
   */
  public int getNumberTimesWrong() {
    return numberTimesWrong;
  }

  /**
   * Accessor for question.
   *
   * @return the question
   */
  public String getQuestion() {
    return question;
  }

  /**
   * Accessor and updator method for rank.
   *
   * @return the _rank
   */
  public int getRank() {
    rank =
        computeFlashcardRank((int) this.getElapsedDays(), numberTimesCorrect,
            numberTimesWrong);
    return rank;
  }

  /**
   * Grabs the subject of the Flashcard.
   *
   * @return - Returns the subject name.
   */
  public String getSubject() {
    return subjectName;
  }

  /**
   * Accessor for subjectName.
   *
   * @return the subjectName
   */
  public String getSubjectName() {
    return subjectName;
  }

  @Override
  public int hashCode() {
    return Long.valueOf(id).hashCode();
  }

  /**
   * Accessor for displayForThisSession.
   *
   * @return the displayForThisSession
   */
  public boolean isDisplayForThisSession() {
    return displayForThisSession;
  }

  /**
   * Mutator for _rank.
   *
   * @param rankL
   *          the _rank to set
   */
  public void setRank(final int rankL) {
    rank = rankL;
  }

  /**
   * Mutator for answer.
   *
   * @param answer
   *          the answer to set
   */
  public void setAnswer(final String answer) {
    this.answer = answer;
  }

  /**
   * Mutator for displayForThisSession.
   *
   * @param displayForThisSession
   *          the displayForThisSession to set
   */
  public void setDisplayForThisSession(final boolean displayForThisSession) {
    this.displayForThisSession = displayForThisSession;
  }

  @Override
  public void setId(final long idL) {
    id = idL;
  }

  /**
   * Mutator for lastUse.
   *
   * @param lastUse
   *          the lastUse to set
   */
  public void setLastUse(final Date lastUse) {
    Date myDate = new Date(lastUse.getTime());
    this.lastUse = myDate;
  }

  /**
   * Mutator for numberTimesCorrect.
   *
   * @param numberTimesCorrect
   *          the numberTimesCorrect to set
   */
  public void setNumberTimesCorrect(final int numberTimesCorrect) {
    this.numberTimesCorrect = numberTimesCorrect;
  }

  /**
   * Mutator for numberTimesWrong.
   *
   * @param numberTimesWrong
   *          the numberTimesWrong to set
   */
  public void setNumberTimesWrong(final int numberTimesWrong) {
    this.numberTimesWrong = numberTimesWrong;
  }

  /**
   * Mutator for question.
   *
   * @param question
   *          the question to set
   */
  public void setQuestion(final String question) {
    this.question = question;
  }

  /**
   * Mutator for subjectName.
   *
   * @param subjectName
   *          the subjectName to set
   */
  public void setSubjectName(final String subjectName) {
    this.subjectName = subjectName;
  }

  @Override
  public String toString() {
    return this.getDataToStore().toString();
  }

  /**
   * Accessor for note Id.
   *
   * @return - The id of the note.
   */
  public long getNoteId() {
    return this.noteId;
  }

  /**
   * Mutator for note Id.
   *
   * @param idL
   *          - The id of to set as the Note's id.
   */
  public void setNoteId(long idL) {
    this.noteId = idL;
  }

}
