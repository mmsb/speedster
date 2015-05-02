/** 
 * Main file for the program's dynamic UI interactions
 * @author sm15

 * main.js handles:
   - Loading the metadata on the main notes page
   - Functionality to add new folders and new notes on the main page
   - Functionality to delete notes and folders
   - Links to appropriate flashcard page
   - Links to the note pages of all notes
   - Style menu overlay where users can define custom rules by folder

 * Style overlay functionality overview:
   - Lets users add new styles ny folder
   - Can delete existing styles
   - Each new style form features optional additional styling for text after the rule trigger word.
   */




$(document).ready(function() {

    // variables/DOM elements needed
    var prevEditingHTML = null;             // prev HTML of the style overlay
    var foldersList = [];                   // global list of existing folders

    /**
     * Handles getting all metadata for folders and within them notes
     * adding them to the DOM as a list to be displayed
     * The JSON format for any folder object in the folder list:

        {
            "folder_id":id,
            "folder_name":name,
            "notes": [{
                        "note_id":id,
                        "note_name":name
                      },
                      {
                        "note_id":id,
                        "note_name":name
                      }]
        }

        */
        (function getAllMetadata() {
            $.get("/notes", function(responseJSON) {
            // var responseObject = JSON.parse(responseJSON);
            
            // assuming server returns 'List<JSONStrings> folders'.
            // var folders = responseObject.folder;
            var folders = foldersList;
            var json = $(".data");
            var jsonArray = JSON.parse(json.text());
            foldersList = jsonArray;
            displayTitles(jsonArray);
        });
        })();



    /**
     * Handles creating the DOM elements for displaying
     * folder and note titles on the main page
     */
    function displayTitles(folderList) {

        // go over the list of folders
        for(var i = 0; i < folderList.length; i++) {

            // create the folder name div
            var folder_div = document.createElement("div");
            folder_div.className = "folder_name_div";
            folder_div.id = folderList[i].folder_id;
            $(folder_div).attr('data-folder',folderList[i]);

            // header span to hold folder title
            var header_span = document.createElement('div');
            header_span.className = 'folder_header_span';
            header_span.innerHTML = '<span class="title">' + folderList[i].folder_name + '</span>';
            $(folder_div).html(header_span);

            // append the + icon, delete icon and flashcard icon
            createCircleDiv(folder_div, header_span);
            $(header_span).append('<div class="delete_icon" id="delete_icon_' + foldersList[i].folder_id + '"></div>');
            createFlashcardDiv(header_span, folderList[i].folder_name);
            $(header_span).append('<br>');

            // set icon visibililty on hover
            $(header_span).hover(function() {
                $(this).find('.delete_icon')[0].style.visibility = 'visible';
                $(this).find('.flashcard_icon')[0].style.visibility = 'visible';

            }, function() {
                $(this).find('.delete_icon')[0].style.visibility = 'hidden';
                $(this).find('.flashcard_icon')[0].style.visibility = 'hidden';
            });

            // create a main div for each folder to hold it's note titles
            main_note_div = document.createElement('main_note_div');
            main_note_div.className = 'main_note_div';
            folder_div.appendChild(main_note_div);

            // bind click handler to delete icon
            // sends post request to delete the folder.
            var deleteParam = {
                div: folder_div, 
                name: foldersList[i].folder_name, 
                id: foldersList[i].folder_id
            };

            $(folder_div).find('.delete_icon').bind('click', deleteParam, function(event) {
                var postParam = {
                    folder: event.data.name
                }
                
                $.post('/deleteFolder', postParam, function(responseJSON) {
                    $(event.data.div).remove();

                    // get an updated list of folders from the server and update the jS global list.
                    $.get('/moreNotes', postParam, function(responseJSON) {
                        foldersList = JSON.parse(responseJSON);
                    });
                });
            });

            // iterate over the notes for this folder and add them to the DOM
            for(var j = 0; j < folderList[i].notes.length; j++) {

                // create divs for the note titles 
                var notes_div = document.createElement("div");
                notes_div.className = "note_name_div";
                notes_div.id = folderList[i].notes[j].note_id;
                notes_div.innerHTML = '<span class="note_name">' + folderList[i].notes[j].note_name + '</span>';

                // add delete icon
                $(notes_div).append('<div class="delete_icon delete_icon_notes" id="delete_icon_' + notes_div.id + '"></div>');
                main_note_div.appendChild(notes_div);

                // bind click handler that redirects clicking the note name div to the note itself
                // the note opens in a separate tab.
                $(notes_div).bind('click', {name: folderList[i].folder_name}, function(event) {
                    window.open('/getNote/' + event.data.name + "/" +  this.id, '_blank');
                });

                var deleteParam = {
                    main_div: main_note_div, 
                    div: notes_div, 
                    id: folderList[i].notes[j].note_id, 
                    folder: folderList[i].folder_name
                }

                // bind click handler for note deletion
                $(notes_div).find('.delete_icon').bind('click', deleteParam, function(event) {
                    event.preventDefault();
                    event.stopPropagation();
                    var postParam = {
                        note_id: event.data.id,
                        subject: event.data.folder
                    }

                    // sends post request to server to delete the note and updates the DOM
                    $.post('/deleteNote', postParam, function(responseJSON) {
                        $(event.data.div).remove();
                        if(event.data.main_div.innerHTML === "") {
                            $(event.data.main_div).slideUp('fast');
                        }
                    });
                });

                $(notes_div).hover(function() {
                    $(this).find('.delete_icon').css({'visibility':'visible'}); 
                },function() {
                    $(this).find('.delete_icon').css({'visibility':'hidden'}); 
                });
            }

            // the list of notes is collapsed display by default.
            if(main_note_div) {
                $(main_note_div)[0].style.display='none';
            }
            
            // notes list can be toggled into display by clicking the folder title
            $(folder_div).find('.title').bind('click', {notes: main_note_div}, function(event) {
                if(event.data.notes.innerHTML !== "") {
                    $(event.data.notes).slideToggle(175);
                }
            });

            $('#main-div').append(folder_div);
        }
    }

    /**
     * Helper function to create the 'add section + sign button'
     */
    function createCircleDiv(folderDiv, header_span) {
        var circle = document.createElement("div");
        circle.className = "circle_image";
        header_span.appendChild(circle);
        $(circle).click(function(event) {
            createNewNote(folderDiv);
        });
    }


     /**
      * Helper function to create flashcard 'REVIEW' button
      */
    function createFlashcardDiv(folderDiv, folderName) {
        var flashcardIcon = document.createElement('div');
        flashcardIcon.innerText = 'REVIEW';
        flashcardIcon.className = 'flashcard_icon';
        folderDiv.appendChild(flashcardIcon);
        $(flashcardIcon).attr('contenteditable', 'false');
        $(flashcardIcon).click(function(event) {
            window.open('/getNewSession/' + encodeURIComponent(folderName), '_blank');
        });
    }



    /**
     * Adds an input field when user clicks the '+' icon on a folder
     * Once the server creates the note and the request is completed
     * The input field turns into a non-editable div title
     * The title can be changed by going into the note and changing the note title
     */
    function createNewNote(folderDiv, header_span) {

        // create new note
        var new_note_div = document.createElement("div");
        new_note_div.className = "new_note_name_div";
        $(new_note_div).html('<input type="text" class="note_title note_title_input" placeholder="NOTE NAME" maxlength="30"></input>');
        $(new_note_div).find('.note_title').attr('contenteditable','true');
        $(new_note_div).attr('folder', $(folderDiv).find('.title')[0].innerText);
        new_note_div.id = -1;
        
        // append to the folder's main note div
        $(new_note_div).append('<div class="delete_icon" id="delete_icon_' + -1 + '"></div>');
        folderDiv.appendChild(new_note_div);

        // triggers the saving action bound to focusput on enter key press.
        $(new_note_div).find('.note_title').keyup(function(event) {
            if(event.keyCode === 13 || event.which === 13) {
               $(new_note_div).find('.note_title').trigger('focusout');
            }
        });

        // saves note if user focuses out of the note name input
        $(new_note_div).find('.note_title').focusout(function() {
            if(this.value !== "") {
                var postParam = {
                    folder_id :folderDiv.id,
                    folder_name : $(folderDiv).find('.title')[0].innerText,
                    note_id : -1,
                    note_name : this.value
                };

                // post request to save the note
                $.post('/newNote', postParam, function(responseJSON) {
                    var responseObject = JSON.parse(responseJSON);
                    // convert the text input to an actual div with the delete icon
                    $(new_note_div).removeClass('new_note_name_div');
                    $(new_note_div).html('<span class="note_name">' + postParam.note_name + '</span>');
                    $(new_note_div).addClass('note_name_div');
                    new_note_div.id = responseObject.note_id;
                    $(new_note_div).append('<div class="delete_icon delete_icon_notes" id="delete_icon_' + new_note_div.id + '"></div>');
                    
                    // bind click handler to redirect to the note page.
                    $(new_note_div).bind('click', {name: postParam.folder_name}, function(event) {
                        window.open('/getNote/' + event.data.name + "/" +  this.id, '_blank');
                    });

                    // binds click handler to the delete icon
                    $(new_note_div).find('.delete_icon').bind('click', {folder_div: folderDiv, div: new_note_div, folder: postParam.folder_name}, function(event) {
                        event.stopPropagation();
                        event.preventDefault();
                        var postParam = {
                            note_id: this.id,
                            subject: event.data.folder
                        }

                        // post request for note deletion
                        $.post('/deleteNote', postParam, function(responseJSON) {
                            event.preventDefault();
                            event.stopPropagation();
                            $(event.data.div).remove();
                            if($(event.data.folder_div).find('.main_note_div')[0].innerHTML === "") {
                                $(event.data.folder_div).find('.main_note_div').slideUp('fast');
                            }

                        });
                    });

                    // set hover handler to see the delete icon
                    $(new_note_div).hover(function() {
                        $(this).find('.delete_icon').css({'visibility':'visible'}); 
                    },function() {
                        $(this).find('.delete_icon').css({'visibility':'hidden'}); 
                    });
                    /// add the div to the note div of the folder.
                    $(folderDiv).find('.main_note_div').append(new_note_div);
                });

            }

        }); 
    }



/* Format to pass back newly created folders to server
    [{
        "folder_id":id,
        "title": this.innerText
    },

    {
        "folder_id":id,
        "title":this.innerText
    }]      

    This folder contains a temporary id

    (This will be sent as stringified JSON)
    */


/* Format to pass back newly created notes to the server
    [{
        "associated_folder_id": folder_id,
        "title": this.innerText
    },
    {
        "associated_folder_id":f_id,
        "title":this.innerText
    }]
    
    (This will be sent as stringified JSON)


    The server will assign it it's note id and also change
    the folder id if needed.

    */
    

     /**
      * click handler for the add new section button
      */
      function addSectionClick() {
        var new_folder_div = document.createElement("div");
        var header_span = document.createElement('div');
        header_span.className = 'folder_header_span_new';
        // $(header_span).attr('contenteditable', 'true');
        $(new_folder_div).html(header_span);
        new_folder_div.className = "new_folder_name_div";
        
        header_span.innerHTML = '<input class="title title_note" maxlength="30" placeholder="NEW FOLDER" maxlength="30" autofocus="true"></input>';

        $(new_folder_div).find('.title').focus();
        // alert($(header_span).find('.title_note').is(":focus"));

        // $(new_folder_div).find('.title').attr('contenteditable', 'true');

        $(new_folder_div).find('.title').keyup(function(event) {
            if(event.keyCode === 13 || event.which === 13) {
               if(this.value !== "") {
                var folder_data = {
                    "folder_id": -1,
                    "title": this.value
                };

                $.get('/newFolder', folder_data, function(responseJSON) {
                    var responseObject = JSON.parse(responseJSON);
                    var folder_id = responseObject.id;
                    var folder_name = responseObject.title;
                    new_folder_div.id = folder_id;
                    header_span.innerHTML = '<span class="title">' + folder_name + '<span>'; 
                    $(header_span).removeClass('folder_header_span_new');
                    header_span.className = 'folder_header_span';
                    $(new_folder_div).html(header_span);
                    createCircleDiv(new_folder_div, header_span);

                    $(header_span).append('<div class="delete_icon" id="delete_icon_' + folder_id + '"></div>');
                    createFlashcardDiv(header_span, folder_name);
                    $(header_span).append('<br>');

                    $(header_span).hover(function() {
                        $(this).find('.delete_icon')[0].style.visibility = 'visible';
                        $(this).find('.flashcard_icon')[0].style.visibility = 'visible';

                    }, function() {
                        $(this).find('.delete_icon')[0].style.visibility = 'hidden';
                        $(this).find('.flashcard_icon')[0].style.visibility = 'hidden';
                    });

                    $(new_folder_div).removeClass('new_folder_name_div');
                    $(new_folder_div).addClass('folder_name_div');

                    var main_note_div = document.createElement('div');
                    main_note_div.className = 'main_note_div';
                    new_folder_div.appendChild(main_note_div);

                    $(new_folder_div).find('.title').bind('click', {notes: main_note_div}, function(event) {

                        if(event.data.notes.innerHTML !== "") {
                            $(event.data.notes).slideToggle(175);
                        }
                    });


                    $(new_folder_div).find('.delete_icon').bind('click', {div: new_folder_div, name: folder_name, id: folder_id}, function(event) {
                        var postParam = {
                            folder: event.data.name
                        }


                        $.post('/deleteFolder', postParam, function(responseJSON) {
                                // #TODO: returns boolean for successful deletion of folders, check for that and dsiplay to user
                                // appropriately.
                                // window.location.href = '/notes';
                                $(event.data.div).remove();

                                // #TODO: remove folder from edit style menu as well!
                                // edit: request for the updated folder list from server and update the global varible 'foldersList'
                                $.get('/moreNotes', postParam, function(responseJSON) {
                                    var responseObject = JSON.parse(responseJSON);
                                    foldersList = responseObject;
                                });

                            });
                    });

var getParams = {};

$.get('/moreNotes', getParams, function(responseJSON) {
    var responseObject= JSON.parse(responseJSON);
    foldersList = responseObject;
});



                        // #TODO: Add a corresonding folder thing to the style overlay,
                        // edit: request for an updated folder list from the server and reassign the variable 'foldersList'

                    });
}
}
})

$(new_folder_div).find('.title').focusout(function() {
    if(this.value !== "") {
        var folder_data = {
            "folder_id": -1,
            "title": this.value
        };

        $.get('/newFolder', folder_data, function(responseJSON) {
            var responseObject = JSON.parse(responseJSON);
            var folder_id = responseObject.id;
            var folder_name = responseObject.title;
            new_folder_div.id = folder_id;
            header_span.innerHTML = '<span class="title">' + folder_name + '<span>'; 
            $(header_span).removeClass('folder_header_span_new');
            header_span.className = 'folder_header_span';
            $(new_folder_div).html(header_span);
            createCircleDiv(new_folder_div, header_span);

            $(header_span).append('<div class="delete_icon" id="delete_icon_' + folder_id + '"></div>');
            createFlashcardDiv(header_span, folder_name);
            $(header_span).append('<br>');

            $(header_span).hover(function() {
                $(this).find('.delete_icon')[0].style.visibility = 'visible';
                $(this).find('.flashcard_icon')[0].style.visibility = 'visible';

            }, function() {
                $(this).find('.delete_icon')[0].style.visibility = 'hidden';
                $(this).find('.flashcard_icon')[0].style.visibility = 'hidden';
            });

            $(new_folder_div).removeClass('new_folder_name_div');
            $(new_folder_div).addClass('folder_name_div');

            var main_note_div = document.createElement('div');
            main_note_div.className = 'main_note_div';
            new_folder_div.appendChild(main_note_div);

            $(new_folder_div).find('.title').bind('click', {notes: main_note_div}, function(event) {

                if(event.data.notes.innerHTML !== "") {
                    $(event.data.notes).slideToggle(175);
                }
            });


            $(new_folder_div).find('.delete_icon').bind('click', {div: new_folder_div, name: folder_name, id: folder_id}, function(event) {
                var postParam = {
                    folder: event.data.name
                }
                
                
                $.post('/deleteFolder', postParam, function(responseJSON) {
                            // #TODO: returns boolean for successful deletion of folders, check for that and dsiplay to user
                            // appropriately.
                            // window.location.href = '/notes';
                            $(event.data.div).remove();

                            // #TODO: remove folder from edit style menu as well!
                            // edit: request for the updated folder list from server and update the global varible 'foldersList'
                            $.get('/moreNotes', postParam, function(responseJSON) {
                                var responseObject = JSON.parse(responseJSON);
                                foldersList = responseObject;
                            });

                        });
            });

var getParams = {};

$.get('/moreNotes', getParams, function(responseJSON) {
    var responseObject= JSON.parse(responseJSON);
    foldersList = responseObject;
});



                    // #TODO: Add a corresonding folder thing to the style overlay,
                    // edit: request for an updated folder list from the server and reassign the variable 'foldersList'

                });
}
});

$('#main-div').append(new_folder_div);

}

    // attach handler to the button
    $('#add_section_button').click(function(event) {
        addSectionClick();
    });

    // handler for the edit style button on the main page,
    // displays the style edit overlay
    $('#edit_style_button').click(function(event) {
        $('.example_overlay')[0].style.display = "table";
        $('.example_content')[0].style.display = "table-cell";
        createEditStyleDivs();
    });

/************************************
 ************************************
 * STYLE EDITING OVERLAY STUFF ******
 ************************************
 ************************************/

    /**
     * creates all HTML of the edit styles overlay
     * 
     */
     function createEditStyleDivs() {
        // for each existing folder

        for(var i = 0; i < foldersList.length; i++) {
            // create a style div
            var style_div = document.createElement('div');
            $('.example_content')[0].appendChild(style_div);
            style_div.className = 'style_div';
            style_div.id = foldersList[i].folder_id;
            

            // for each folder's style div, create a toolbar per style text to be edited

            /* $(style_div).html('<h2 class="folder_style_header">' +  
                foldersList[i].folder_name +   
                '</h2>' + createStyleToolbar('note', foldersList[i].folder_id) + 
                createStyleToolbar('q', foldersList[i].folder_id) + createStyleToolbar('section', foldersList[i].folder_id)); */

$(style_div).html('<span class="folder_style_header">' +   

    '<span class="circle collapse-main arrow-right" id="collapse-main_' + foldersList[i].folder_id + '"></span>' + '<span>' + '       ' + 
    foldersList[i].folder_name  + '</span>' + 
    '<div class="inner_style_div" id="inner_style_div_' + foldersList[i].folder_id + '">' + 
    '<span class="new-style-header-to-add"> New Style <span class="circle_image" id="style-circle"></span></span>' + 
    '<div class="rule_div" id="rule_div_' + foldersList[i].folder_id + '">' +
    'Rule <input type="text" class="rulename" placeholder="Name" id="rulename_' + foldersList[i].folder_id + '" maxlength="20"></input><br>    \
    should start with <input type="text" class="rulestart" id="rulestart_' + foldersList[i].folder_id + '" placeholder="Character String" maxlength="15"></input><br>  \
    and have these styles: <br>' + 
    createStyleToolbar('start-style-bar', foldersList[i].folder_id, "") + 
    '<span class="extra_styles_title" id="extra_styles_title_' + foldersList[i].folder_id + '"><span class="circle additional-style-collapse arrow-right"><span class="arrow-down"></span></span>' +
    '  Additional Styles</span><br>' +
    '<div class="extra_styles_div" id="extra_styles_div_' + foldersList[i].folder_id + '"><span>Extend these styles until</span><br>'  
    + '<input type="text" class="trigger-end-sequence" id="trigger-end-sequence_' + foldersList[i].folder_id + '" placeholder = "Character String" maxlength="10"></input>  OR \
    <input type="checkbox" class="newline-trigger" id="newline-trigger_' + foldersList[i].folder_id + '"></input>  Newline<br><br>' + 
    'Style text after this rule until<br>'
    + '<input type="text" class="text-after-end-sequence" id="text-after-end-sequence_' + foldersList[i].folder_id + '" placeholder = "Character String" maxlength="10"></input>  OR \
    <input type="checkbox" class="newline-text-after" id="newline-text-after_' + foldersList[i].folder_id + '"></input>  Newline<br>' + 
    '<span style="margin-left:3%" id="span_to_toggle_' + foldersList[i].folder_id + '">with these styles</span> <br>' 
    + createStyleToolbar('text-after-style-bar', foldersList[i].folder_id, "") +
    '<input type="checkbox" name="boxed" value="box" class="box" id="box_' + foldersList[i].folder_id + '"></input>  Box this rule<br>' +
    '<input type="checkbox" name="centered" value="center" class="center" id="center_' + foldersList[i].folder_id + '"></input>   Center this rule<br><br></div><br>' +
    '<div class="submit-button" id="submit_' + foldersList[i].folder_id + '">SAVE</div>' + 
    '</div>' + 
    '</div>'); 

$('#newline-trigger_' + foldersList[i].folder_id).bind('click', {id: foldersList[i].folder_id }, function(event) {
    if(this.checked) {
        $('#trigger-end-sequence_' + event.data.id)[0].disabled = true;
    } else {
        $('#trigger-end-sequence_' + event.data.id)[0].disabled = false;
    }
});

$('#newline-text-after_' + foldersList[i].folder_id).bind('click', {id: foldersList[i].folder_id }, function(event) {
    if(this.checked) {
        $('#text-after-end-sequence_' + event.data.id)[0].disabled = true;
        $('#toolbar_text-after-style-bar' + event.data.id)[0].style.visibility = "visible";
        $('#span_to_toggle_' + event.data.id)[0].style.visibility = "visible";

    } else {
        $('#text-after-end-sequence_' + event.data.id)[0].disabled = false;
        if($('#text-after-end-sequence_' + event.data.id)[0].value === "") {
            $('#toolbar_text-after-style-bar' + event.data.id)[0].style.visibility = "hidden";
            $('#span_to_toggle_' + event.data.id)[0].style.visibility = "hidden";
        }
    }
});

$('#text-after-end-sequence_' + foldersList[i].folder_id).bind('keyup', {id: foldersList[i].folder_id}, function(event) {
    if(this.value !== "" || $('#newline-text-after_' + event.data.id)[0].checked) {
                    // disable everything below it
                    $('#toolbar_text-after-style-bar' + event.data.id)[0].style.visibility = "visible";
                    $('#span_to_toggle_' + event.data.id)[0].style.visibility = "visible";

                } else if(this.value === "" && $('#newline-text-after_' + event.data.id)[0].checked === false) {
                    $('#toolbar_text-after-style-bar' + event.data.id)[0].style.visibility = "hidden";
                    $('#span_to_toggle_' + event.data.id)[0].style.visibility = "hidden";
                }
            });

            // disable everything below the text-after-end-sequence (style text after this rule)
            $('#toolbar_text-after-style-bar' + foldersList[i].folder_id)[0].style.visibility = "hidden";
            $('#span_to_toggle_' + foldersList[i].folder_id)[0].style.visibility = "hidden";
            

            $(style_div).find('.additional-style-collapse').bind('click', {id:foldersList[i].folder_id}, function(event) {
                $(document.getElementById('extra_styles_div_' + event.data.id)).slideToggle(175);
                if($(this).hasClass('arrow-right')) {
                    $(this).removeClass('arrow-right');
                    $(this).addClass('arrow-down');

                } else {
                    $(this).removeClass('arrow-down');
                    $(this).addClass('arrow-right');
                }
            });

            $(style_div).find('#style-circle').bind('click', {id: foldersList[i].folder_id}, function(event) {
                var folderID = event.data.id;
                var divToCollapse = document.getElementById('rule_div_' + folderID);
                $(divToCollapse).slideToggle(175);
                
            });

            $(style_div).find('.collapse-main').bind('click', {id: foldersList[i].folder_id}, function(event) {
                $('#inner_style_div_' + event.data.id).slideToggle(175);
                if($(this).hasClass('arrow-right')) {
                    $(this).removeClass('arrow-right');
                    $(this).addClass('arrow-down');

                } else {
                    $(this).removeClass('arrow-down');
                    $(this).addClass('arrow-right');
                }
            });

            setTextStyleToggle('text-after-style-bar', foldersList[i].folder_id, "", 'font-weight');
            setTextStyleToggle('text-after-style-bar', foldersList[i].folder_id, "", 'font-style');
            setTextStyleToggle('text-after-style-bar', foldersList[i].folder_id, "", 'text-decoration');
            setTextStyleToggle('start-style-bar', foldersList[i].folder_id, "", 'font-weight');
            setTextStyleToggle('start-style-bar', foldersList[i].folder_id, "", 'font-style');
            setTextStyleToggle('start-style-bar', foldersList[i].folder_id, "", 'text-decoration');

            getSubjectRules(style_div, foldersList[i].folder_id, foldersList[i].folder_name, "");
        }


        // get the existing style rules from the server here!!
        var getParams = {};
        var rules = [];
        $.get('/getRules', getParams, function(responseJSON) {
            console.log("RULES RECIEVED:   " + responseJSON);
            rules = JSON.parse(responseJSON);

            createExistingStyleRules(rules);

        });

        

        // add in button div
        var button_div = document.createElement('div');
        button_div.className = "style_button_div";
        $('.example_content')[0].appendChild(document.createElement('br'));
        $('.example_content')[0].appendChild(document.createElement('br'));
        $('.example_content')[0].appendChild(document.createElement('br'));


        $('.example_content')[0].appendChild(button_div);

        
    }

    // eg: style_text == 'note', style_type = 'bold' ... 
    // search for id --> 'note' + 'folder_id' + '_' + 'bold'
    // to be used for B, I, U   .... text styles
    // sets up the toggling of values for the B, I, U styles (or any others that can have only two states)
    // ex: id of bold button:   text-after-style-bar'folder_id'_font-weight
    // toggle(text-after-style-bar, folder id, font-weight)
    function setTextStyleToggle(style_text, folder_id, rulename, style_type) {
        var button = $('#' + style_text + folder_id + rulename + '_' + style_type);
        if(style_type === 'font-weight' || style_type === 'font-style' || style_type === 'text-decoration') {
            button.click(function(event) {

                if($(this).attr('value') === 'none') {
                    var new_val = $(this).attr('name');
                    $(this).attr('value', new_val);
                    $(this).css('background-color', 'rgba(0,0,0,0.3)');
                } else if($(this).attr('value') === $(this).attr('name')) {
                    $(this).attr('value', 'none');
                    $(this).css('background-color','inherit');
                }

                // alert($(this).attr('value'));
            });
        }
    }

     /**
     * given a rule to style, and the folder id, this creates the toolbar
     * for that folder and that rule with unique ids that include the folder id
     * and the rule word itself.
     * ex: createStyleToolbar('note', 2)
     * or, createStyleToolbar('q', 3);
     * or, for custom styles
     * ---- >     start-style-bar'id'

     ex: createStyleToolbar('text-after-style-bar', foldersList[i].folder_id)
     id of bold button:   text-after-style-bar'folder_id'_font-weight
     */
     function createStyleToolbar(style, id, rulename) {
        return '<div class="style-toolbar" id="toolbar_' + style + id + rulename + '">  \
        <div class="boldButton" id="' + style + id + rulename + '_font-weight" value="none" name="bold">B</div> \
        <div class="italicButton" id="' +  style + id + rulename + '_font-style" value="none" name="italic">i</div> \
        <div class="underlineButton" id="' + style + id + rulename + '_text-decoration" value="none" name="underline">U</div> \
        <select class="font-family" id="' + style + id + rulename + '_font-family">    \
        <option selected="selected" disabled="disabled">Font Type</option>  \
        <option value="Playfair Display">Playfair Display</option> \
        <option value="Bitter">Bitter</option> \
        <option value="Open Sans">Open Sans</option> \
        <option value="Merriweather">Merriweather</option> \
        <option value="Palatino">Palatino</option>  \
        </select> \
        <select class="font-size" id="' + style + id + rulename + '_font-size" >   \
        <option selected="selected" disabled="disabled">Font Size</option>  \
        <option value="Small">Small</option>    \
        <option value="Medium">Medium</option>  \
        <option value="Big">Big</option>    \
        </select> \
        </div><br><br>';

    }



    /**
     * Trying to grab all rule objects of a given folder/subject
     * styleDiv is the style div of that folder.
     * folderID and folderName is well... id and name of the folder
     
     */
     function getSubjectRules(styleDiv, folderID, folderName, rulename) {
        $('#submit_' + folderID + rulename).bind('click', {id: folderID, name: folderName, div: styleDiv, rule: rulename}, function(event) {


            var rulesForThisFolder = getRulesList(event.data.div, event.data.id, event.data.name, event.data.rule);

            var postParam = {
                rules: JSON.stringify(rulesForThisFolder)
            };

            console.log("RULES SENT:  " + postParam.rules);
            
            $.post('/updateCSS', postParam, function(responseJSON) {
                $('.example_content')[0].innerHTML = '<span id="rule-header">STYLE RULES</span><span class="close-button"></span>';
                $('.example_overlay')[0].style.display = "table";
                $('.example_content')[0].style.display = "table-cell";

                createEditStyleDivs();

                
                $('#inner_style_div_' + event.data.id)[0].style.display = 'block';
                $('#collapse-main_' + event.data.id).removeClass('arrow-right');
                $('#collapse-main_' + event.data.id).addClass('arrow-down');

                $('.close-button').click(function(event) {
                    closeStyleMenu();
                });
            });
            
        });
}

    /** rules list of the folder given
     *
     */
     function getRulesList(styleDiv, folder_id, folder_name, rulename) {
        var rulesForThisFolder = [];
        $(styleDiv).find('.rule_div').each(function(i) {
            var name = $(this).find('.rulename')[0].value.replace(/^[^A-Z0-9]+|[^A-Z0-9]+$/ig, '').replace(/\s+/g, '').replace('\'', '');
            if(!document.getElementById('rulename_' + folder_id + name)) { 
                name = "";
            } 
            rulename = name;
            
            var rule = 
            {   
                "associated_folder_id": folder_id,
                "associated_folder_name": folder_name,
                "name": document.getElementById('rulename_' + folder_id + name).value,
                "trigger":
                {
                    "word": document.getElementById('rulestart_' + folder_id + name).value,
                    "endSeq": getTriggerEndSequence(this, folder_id, name),
                    "style": 
                    {
                        "font-weight": getButtonValue('start-style-bar', 'font-weight', folder_id, name),
                        "font-style": getButtonValue('start-style-bar', 'font-style', folder_id, name),
                        "text-decoration": getButtonValue('start-style-bar', 'text-decoration', folder_id, name),
                        "font-family": getButtonValue('start-style-bar', 'font-family', folder_id, name),
                        "font-size": getButtonValue('start-style-bar', 'font-size', folder_id, name),
                    }
                },

                "after": 
                {
                    "endSeq": getAfterEndSequence(this, folder_id, name),
                    "style": 
                    {
                        "font-weight": getButtonValue('text-after-style-bar', 'font-weight', folder_id, name),
                        "font-style": getButtonValue('text-after-style-bar', 'font-style', folder_id, name),
                        "text-decoration": getButtonValue('text-after-style-bar', 'text-decoration', folder_id, name),
                        "font-family": getButtonValue('text-after-style-bar', 'font-family', folder_id, name),
                        "font-size": getButtonValue('text-after-style-bar', 'font-size', folder_id, name),
                    }
                },

                // "container": 
                // {
                //     "style":
                //     {
                //         "background-color": $(this).find('.box')[0].checked ? "white" : "inherit",
                //         "text-align": $(this).find(".center")[0].checked ? "center" : "left"
                //     }
                // }
            }

            
            clearIrrelevantStyles(rule);

            // trying to do Nick's styling requests for container object; 
            // #TODO: Do the same with rule.after as with rule.container
            // in other words, don't send an rule.after object if nothing is specified.
            if(document.getElementById('box_' + folder_id + rulename).checked === true) {
                rule["container"] = {};
                rule["container"]["style"] = {}
                rule["container"]["style"]["background-color"] = "rgba(255, 255, 255, 0.35)";
                rule["container"]["style"]["padding"] = "4px";
                rule["container"]["style"]["padding-left"] = "7px";
                rule["container"]["style"]["padding-right"] = "7px";
            }

            if(document.getElementById('center_' + folder_id + rulename).checked === true) {
                if(rule["container"]) {
                    rule["container"]["style"]["text-align"] = "center";
                } else {
                    rule["container"] = {};
                    rule["container"]["style"] = {}
                    rule["container"]["style"]["text-align"] = "center";
                }
            }

            if(document.getElementById('box_' + folder_id + rulename).checked && document.getElementById('center_' + folder_id + rulename).checked) {
                rule["container"]["style"]["display"] = "table";
                rule["container"]["style"]["margin"] = "auto";
            }

            // console.log(rule);

            rulesForThisFolder.push(rule);
            
        });
return rulesForThisFolder;
}



    /** delete irrelevant styles from trigger.style
    */
    function clearIrrelevantStyles(rule) {
        // clean up rule.trigger.style
        if(rule["trigger"]["style"]["font-weight"] === "none") {
            delete rule["trigger"]["style"]["font-weight"];
        }

        if(rule["trigger"]["style"]["font-style"] === "none") {
            delete rule["trigger"]["style"]["font-style"];
        }

        if(rule["trigger"]["style"]["text-decoration"] === "none") {
            delete rule["trigger"]["style"]["text-decoration"];
        }

        if(rule["trigger"]["style"]["font-family"] === null) {
            delete rule["trigger"]["style"]["font-family"];
        }

        if(rule["trigger"]["style"]["font-size"] === null) {
            delete rule["trigger"]["style"]["font-size"];
        }

        if(!rule["trigger"]["style"]["font-weight"] &&
            !rule["trigger"]["style"]["font-style"] &&
            !rule["trigger"]["style"]["text-decoration"] &&
            !rule["trigger"]["style"]["font-family"] &&
            !rule["trigger"]["style"]["font-size"]) {
            delete rule["trigger"]["style"];
    }

        // rule.after and rule.after.style

        if(rule["after"]["endSeq"] === "" && rule["after"]["endSeq"] !== "99999999999") {
            delete rule["after"];
        } 

        if(rule["after"]) {
            if(rule["after"]["style"]["font-weight"] === "none") {
                delete rule["after"]["style"]["font-weight"];
            }

            if(rule["after"]["style"]["font-style"] === "none") {
                delete rule["after"]["style"]["font-style"];
            }

            if(rule["after"]["style"]["text-decoration"] === "none") {
                delete rule["after"]["style"]["text-decoration"];
            }

            if(rule["after"]["style"]["font-family"] === null) {
                delete rule["after"]["style"]["font-family"];
            }

            if(rule["after"]["style"]["font-size"] === null) {
                delete rule["after"]["style"]["font-size"];
            }

        }

        if(rule["after"] && 
            !rule["after"]["style"]["font-weight"] &&
            !rule["after"]["style"]["font-style"] &&
            !rule["after"]["style"]["text-decoration"] &&
            !rule["after"]["style"]["font-family"] &&
            !rule["after"]["style"]["font-size"]) {
            delete rule["after"]["style"];
    }
}

    /**
     * get the value for the styling toolbar buttons according to their unique id
     * on clicking the save style button, so we can updates for each style

     ex: id of bold button:   text-after-style-bar'folder_id'_font-weight
     style_text = 'text-after-style-bar'
     style_type = 'font-weight'
     folder_id = folder id ...
     */
     function getButtonValue(style_text, style_type, folder_id, rulename) {
        // ex: note2_bold
        // alert(style_type);
        if(style_type === 'font-style' || style_type === 'font-weight' || style_type === 'text-decoration') {
            return $(document.getElementById(style_text + folder_id + rulename + '_' + style_type)).attr('value');
        } 

        if(style_type === "font-family") {
            if($(document.getElementById(style_text + folder_id + rulename + '_' + style_type)).val()) {
                return $(document.getElementById(style_text + folder_id + rulename + '_' + style_type)).val();
            } else {
                return null;
            } 
        } 

        if(style_type === "font-size") {
            // alert("FONT SIZEEEE");
            //alert($(document.getElementById(style_text + folder_id + rulename + '_' + style_type)).val());
            if($(document.getElementById(style_text + folder_id + rulename + '_' + style_type)).val() === "Small") {
                return '17px';
            } else if($(document.getElementById(style_text + folder_id + rulename + '_' + style_type)).val() === "Medium") {
                return '22px';
            } else if($(document.getElementById(style_text + folder_id + rulename + '_' + style_type)).val() === "Big"){
                return '30px';
            } else {
                return null;
            }
        }
    }


    /*
     *
     */
     function getTriggerEndSequence(inner_div, folderID, rulename) {

        return $(inner_div).find('.newline-trigger')[0].checked ? "99999999999" : document.getElementById('trigger-end-sequence_' + folderID + rulename).value;
    }

    /*
     *
     */
     function getAfterEndSequence(inner_div, folderID) {
        return $(inner_div).find(".newline-text-after")[0].checked ? "99999999999" : $(inner_div).find('.text-after-end-sequence')[0].value;
    }


/* 

Rule:
{
  "associated_folder_id": event.data.id,
  "associated_folder_name": event.data.name,
  "name": "string"
  "trigger":
  {
    "word": "string",
    "endSeq": "thing typed in box if they typed something", "<br>\u200b" if they checked newline
    "style": 
    {
        "font-weight":"bold",
        "font-style": "italic",
        "text-decoration":"underline",
        "font-family": "Times New Roman",
        "font-size": "small/medium/big"

    }
  }

  "after":
  {
    "endSeq": "thing they typed in the style text after box" or "<br>\u200b" if they checked newline
    "style": 
    {
        "font-weight":"bold",
        "font-style": "italic",
        "text-decoration":"underline",
        "font-family": "Times New Roman",
        "font-size": "small/medium/big"

    }
  }

  "container":
  {
    "style": 
    {
        
    }
  }
}



Rules can take the following forms based on what is defined:

<style1> trigger.word </style1>
<style1> trigger.word (stuff) trigger.endSeq </style1>
<style1> trigger.word </style1> <style2> (stuff) after.endSeq </style2>
<style1> trigger.word (stuff) trigger.endSeq </style1> <style2> (stuff) after.endSeq </style2>

... any of the above but inside of a div (if container and container.style are defined). The div can center things/box things/do whatever css can do.

*/

/*  if(no box is checked -- no style object)
    
    if 'boxed' is checked -- style {
        "background-color": --
    }

    if 'center' is checked -- style {
        "text-align": --
    }

    */


    $('.close-button').click(function() {
        closeStyleMenu();
    });


    /**
     * Click handler for the save styles button
     * #TODO: DO we need this ?
     */
     function closeStyleMenu() {
        // var updated_styles = styleChangesToSave();

        // clear the style editing overlay
        prevEditingHTML = $('.example_content').html();
        $('.example_content')[0].innerHTML = '<span id="rule-header">STYLE RULES</span><span class="close-button"></span>';
        $('.example_overlay')[0].style.display = "none";
        $('.example_content')[0].style.display = "none";
        $('.close-button').click(function() {
            closeStyleMenu();
        });

    }


/* 

Rule:
{
    "associated_folder_id": event.data.id,
    "associated_folder_name": event.data.name,
    "name": "string"
    "trigger":
      {
        "word": "string",
        "endSeq": "thing typed in box if they typed something", "<br>\u200b" if they checked newline
        "style": 
        {
            "font-weight":"bold",
            "font-style": "italic",
            "text-decoration":"underline",
            "font-family": "Times New Roman",
            "font-size": "small/medium/big"

        }
      }

      "after":
      {
        "endSeq": "thing they typed in the style text after box" or "<br>\u200b" if they checked newline
        "style": 
        {
            "font-weight":"bold",
            "font-style": "italic",
            "text-decoration":"underline",
            "font-family": "Times New Roman",
            "font-size": "small/medium/big"

        }
      }

      "container":
      {
        "style": 
        {
            
        }
      }
}


    /**
     * Trying to populate a custom style menu with existing style rules
     * Input --> List of 'rule objects where each object is in the exact format I sent them back to the server'

     * random notes:
     <select class="font-family" id="' + style + id + '_font-family">
     <div class="boldButton" id="' + style + id + rulename + '_font-weight" value="none" name="bold">B</div> \
            
     *
     */
     function createExistingStyleRules(rules) {
        for(var i = 0; i < rules.length; i++) {
            var rule = rules[i];

            var rulename = rule.name;
            var rulename_id = rulename.replace(/^[^A-Z0-9]+|[^A-Z0-9]+$/ig, '').replace(/\s+/g, '').replace('\'', '');
            
            var folder_id = rule.associated_folder_id;
            var folder_name = rule.associated_folder_name;
            var inner_div = document.getElementById('inner_style_div_' + folder_id);

            $(inner_div).prepend('<span class="circle arrow-right existing-styles-collapse" id="existing-styles-collapse_' + folder_id + rulename_id + '"></span>' +
                '<span class="new-style-header" id="new-style-header_' +folder_id +rulename_id+'">' + rulename + '</span>' + 
                '<span class="delete_icon delete_icon_styles" id="delete_icon_' + folder_id + rulename_id + '"></span>' +
                '<div class="rule_div" id="rule_div_' + folder_id + rulename_id + '">' +
                'Rule <input type="text" class="rulename" placeholder="Name" id="rulename_' + folder_id + rulename_id + '" maxlength="20"></input><br>    \
                should start with <input type="text" class="rulestart" id="rulestart_' + folder_id + rulename_id + '" placeholder="Character String" maxlength="15"></input><br>  \
                and have these styles: <br>' + 
                createStyleToolbar('start-style-bar', folder_id, rulename_id) + 
                '<span class="extra_styles_title" id="extra_styles_title_' + folder_id + rulename_id + '">' + 
                '<span class="circle additional-style-collapse arrow-right" id="additional-style-collapse_' + folder_id + rulename_id + '">' +
                '<span class="arrow-down"></span></span>' +
                '  Additional Styles</span><br>' +
                '<div class="extra_styles_div" id="extra_styles_div_' + folder_id + rulename_id + '"><span>' + 
                'Extend these styles until<br>'   
                + '<input type="text" class="trigger-end-sequence" id="trigger-end-sequence_' + folder_id + rulename_id + '" placeholder = "Character String" maxlength="10"></input>  OR \
                <input type="checkbox" class="newline-trigger" id="newline-trigger_' + folder_id + rulename_id + '"></input>  Newline<br><br>' + 
                'Style text after this rule until<br>'
                + '<input type="text" class="text-after-end-sequence" id="text-after-end-sequence_' + folder_id + rulename_id + '" placeholder = "Character String" maxlength="10"></input>  OR \
                <input type="checkbox" class="newline-text-after" id="newline-text-after_' + folder_id + rulename_id + '"></input>  Newline<br>' + 
                '<span id="span_to_toggle_' + folder_id + rulename_id + '">with these styles </span><br>' 
                + createStyleToolbar('text-after-style-bar', folder_id, rulename_id) +
                '<input type="checkbox" name="boxed" value="box" class="box" id="box_' + folder_id + rulename_id+ '"></input>  Box this rule<br>' +
                '<input type="checkbox" name="centered" value="center" class="center" id="center_' + folder_id + rulename_id + '"></input>   Center this rule<br><br></div>' +
                '<div class="submit-button" id="submit_' + folder_id + rulename_id + '">SAVE</div>' + 
                '</div><br id="line_break_' + folder_id + rulename_id +'">');



$('#newline-trigger_' + folder_id + rulename_id).bind('click', {id: folder_id, name: rulename_id}, function(event) {
    if(this.checked) {
        $('#trigger-end-sequence_' + event.data.id + event.data.name)[0].disabled = true;
    } else {
        $('#trigger-end-sequence_' + event.data.id + event.data.name)[0].disabled = false;
    }
});


$('#newline-text-after_' + folder_id + rulename_id).bind('click', {id:folder_id, name: rulename_id }, function(event) {
    if(this.checked) {
        $('#text-after-end-sequence_' + event.data.id + event.data.name)[0].disabled = true;
        $('#toolbar_text-after-style-bar' + event.data.id + event.data.name)[0].style.visibility = "visible";
        $('#span_to_toggle_' + event.data.id + event.data.name)[0].style.visibility = "visible";

    } else {
        $('#text-after-end-sequence_' + event.data.id + event.data.name)[0].disabled = false;
        if($('#text-after-end-sequence_' + event.data.id + event.data.name)[0].value === "") {
            $('#toolbar_text-after-style-bar' + event.data.id + event.data.name)[0].style.visibility = "hidden";
            $('#span_to_toggle_' + event.data.id + event.data.name)[0].style.visibility = "hidden";
        }
    }
});

$('#text-after-end-sequence_' + folder_id + rulename_id).bind('keyup', {id: folder_id, name: rulename_id}, function(event) {
    if(this.value !== "" || $('#newline-text-after_' + event.data.id + event.data.name)[0].checked) {
                    // disable everything below it
                    $('#toolbar_text-after-style-bar' + event.data.id + event.data.name)[0].style.visibility = "visible";
                    $('#span_to_toggle_' + event.data.id + event.data.name)[0].style.visibility = "visible";

                } else if(this.value === "" && $('#newline-text-after_' + event.data.id + event.data.name)[0].checked === false) {
                    $('#toolbar_text-after-style-bar' + event.data.id + event.data.name)[0].style.visibility = "hidden";
                    $('#span_to_toggle_' + event.data.id + event.data.name)[0].style.visibility = "hidden";
                }
            });





$('#rule_div_' + folder_id + rulename_id).find('.additional-style-collapse').bind('click', {id: folder_id, name: rulename_id}, function(event) {
    $('#extra_styles_div_' + event.data.id + event.data.name).slideToggle(175);
    if($(this).hasClass('arrow-right')) {
        $(this).removeClass('arrow-right');
        $(this).addClass('arrow-down');
    } else {
        $(this).removeClass('arrow-down');
        $(this).addClass('arrow-right');
    }
});

$('#existing-styles-collapse_' + folder_id + rulename_id).bind('click', {id: folder_id, name: rulename_id}, function(event) {
    $('#rule_div_' + event.data.id + event.data.name).slideToggle(175);
    if($(this).hasClass('arrow-right')) {
        $(this).removeClass('arrow-right');
        $(this).addClass('arrow-down');
    } else {
        $(this).removeClass('arrow-down');
        $(this).addClass('arrow-right');
    }
});

$('#delete_icon_' + folder_id + rulename_id).bind('click', {id:folder_id, folder: folder_name, rule:rulename_id}, function(event) {
    var list = getRulesList(document.getElementById(event.data.id), event.data.id, event.data.folder, event.data.rule);
    var deleted_rule_name = $('#new-style-header_' + event.data.id + event.data.rule)[0].innerText;


    var postParam = {
        rules_list : JSON.stringify(list),
        deleted_rule: deleted_rule_name,
        subject: event.data.folder
    }

    $.post('/deleteRule', postParam, function(responseJSON) {
        $('#existing-styles-collapse_' + event.data.id + event.data.rule).remove();
        $('#new-style-header_' + event.data.id + event.data.rule).remove();
        $('#delete_icon_' + event.data.id + event.data.rule).remove();
        $('#rule_div_' + event.data.id + event.data.rule).remove();
        $('#line_break_' + event.data.id + event.data.rule).remove();
    });
});

var ruleform = $(inner_div).find('#rule_div_' + folder_id + rulename_id);

if(document.getElementById('rulename_' + folder_id + rulename_id) !== null) {


                // populate rulename
                document.getElementById('rulename_' + folder_id + rulename_id).value = rulename ? rulename: "";

                // populate rule 'starts with word'
                document.getElementById('rulestart_' + folder_id + rulename_id).value = rule.trigger.word ? rule.trigger.word : "";
                var start_style_bar = document.getElementById('#start-style-bar' + folder_id + rulename_id);

                // populate start (trigger word) style bar
                // <div class="boldButton" id="' + style + id + rulename + '_font-weight" value="none" name="bold">B</div> \

                console.log(rule["container"]);
                if(rule.trigger["style"] && rule.trigger["style"]["font-weight"] === "bold") {
                    $(document.getElementById('start-style-bar' + folder_id + rulename_id + '_font-weight')).attr('value','bold');
                    $(document.getElementById('start-style-bar' + folder_id + rulename_id + '_font-weight')).css('background-color','rgba(0,0,0,0.3)');
                    
                } else {
                    $(document.getElementById('start-style-bar' + folder_id + rulename_id + '_font-weight')).attr('value', 'none');
                    $(document.getElementById('start-style-bar' + folder_id + rulename_id + '_font-weight')).css({"background-color": "inherit"});
                }

                if(rule.trigger["style"] && rule.trigger["style"]["font-style"] === "italic") {

                 $(document.getElementById('start-style-bar' + folder_id + rulename_id + '_font-style')).attr('value', 'italic');
                 $(document.getElementById('start-style-bar' + folder_id + rulename_id + '_font-style')).css('background-color','rgba(0,0,0,0.3)');
             } else {
                 $(document.getElementById('start-style-bar' + folder_id + rulename_id + '_font-style')).attr('value', 'none');
                 $(document.getElementById('start-style-bar' + folder_id + rulename_id + '_font-style')).css({"background-color": "inherit"});
             }

             if(rule.trigger["style"] && rule.trigger["style"]["text-decoration"] === "underline") {
                 $(document.getElementById('start-style-bar' + folder_id + rulename_id + '_text-decoration')).attr('value', 'underline');
                 $(document.getElementById('start-style-bar' + folder_id + rulename_id + '_text-decoration')).css("background-color", "rgba(0,0,0,0.3)");
             } else {
                $(document.getElementById('start-style-bar' + folder_id + rulename_id + '_text-decoration')).attr('value', 'none');
                $(document.getElementById('start-style-bar' + folder_id + rulename_id + '_text-decoration')).css({"background-color": "inherit"});
            }

            if(rule["trigger"]["style"] && rule["trigger"]["style"]["font-family"]) {
                document.getElementById('start-style-bar' + folder_id + rulename_id + '_font-family').value = rule["trigger"]["style"]["font-family"];
            }



            if(rule["trigger"] && rule["trigger"]["style"]) {
                if(rule["trigger"]["style"]['font-size'] === "17px") {
                    $(document.getElementById('start-style-bar' + folder_id + rulename_id + '_font-size')).val("Small");
                } else if(rule["trigger"]["style"]["font-size"] === "22px") {
                    $(document.getElementById('start-style-bar' + folder_id + rulename_id + '_font-size')).val("Medium");
                } else if(rule["trigger"]["style"]["font-size"] === "30px") {
                    $(document.getElementById('start-style-bar' + folder_id + rulename_id + '_font-size')).val("Big");
                }
            }


                // document.getElementById('start-style-bar' + folder_id + rulename_id + '_font-size').value = rule["trigger"]["style"]["font-size"];

                setTextStyleToggle('start-style-bar', folder_id, rulename_id, 'font-weight');
                setTextStyleToggle('start-style-bar', folder_id, rulename_id, 'font-style');
                setTextStyleToggle('start-style-bar', folder_id, rulename_id, 'text-decoration');

                setTextStyleToggle('text-after-style-bar', folder_id, rulename_id, 'font-weight');
                setTextStyleToggle('text-after-style-bar', folder_id, rulename_id, 'font-style');
                setTextStyleToggle('text-after-style-bar', folder_id, rulename_id, 'text-decoration');

                // extend these styles until ...
                if(rule.trigger.endSeq !== "99999999999") {
                    document.getElementById('trigger-end-sequence_' + folder_id + rulename_id).value  = rule.trigger.endSeq ? rule.trigger.endSeq : "";
                } else {
                    document.getElementById('newline-trigger_' + folder_id + rulename_id).checked = true;
                    $('#trigger-end-sequence_' + folder_id + rulename_id)[0].disabled = true;
                }

                // style text after this rule until
                if(rule.after && rule.after.endSeq !== "99999999999") {
                    document.getElementById('text-after-end-sequence_' + folder_id + rulename_id).value = rule.after.endSeq ? rule.after.endSeq : "";
                } else if(rule.after && rule.after.endSeq === "99999999999") {
                    document.getElementById('newline-text-after_' + folder_id + rulename_id).checked = true;
                    $('#text-after-end-sequence_' + folder_id + rulename_id)[0].disabled = true;
                }

                // with these styles...
                var after_style_toolbar = document.getElementById('text-after-style-bar' + folder_id + rulename_id);

                if(rule.after && rule.after["style"] && rule.after["style"]["font-weight"] == "bold") {
                    $(document.getElementById('text-after-style-bar' + folder_id + rulename_id + '_font-weight')).attr('value', 'bold');
                    $(document.getElementById('text-after-style-bar' + folder_id + rulename_id + '_font-weight')).css("background-color", "rgba(0,0,0,0.3)");
                } else {
                    $(document.getElementById('text-after-style-bar' + folder_id + rulename_id + '_font-weight')).attr('value', 'none');
                    $(document.getElementById('text-after-style-bar' + folder_id + rulename_id + '_font-weight')).css({"background-color": "inherit"});
                }

                if(rule.after && rule.after["style"] && rule.after["style"]["font-style"] == "italic") {
                    $(document.getElementById('text-after-style-bar' + folder_id + rulename_id + '_font-style')).attr('value', 'italic');
                    $(document.getElementById('text-after-style-bar' + folder_id + rulename_id + '_font-style')).css("background-color", "rgba(0,0,0,0.3)");
                } else {
                    $(document.getElementById('text-after-style-bar' + folder_id + rulename_id + '_font-style')).attr('value','none');
                    $(document.getElementById('text-after-style-bar' + folder_id + rulename_id + '_font-style')).css("background-color", "inherit");
                }

                if(rule.after && rule.after["style"] && rule.after["style"]["text-decoration"] == "underline") {
                    $(document.getElementById('text-after-style-bar' + folder_id + rulename_id + '_text-decoration')).attr('value','underline');
                    $(document.getElementById('text-after-style-bar' + folder_id + rulename_id + '_text-decoration')).css("background-color", "rgba(0,0,0,0.3)");
                } else {
                    $(document.getElementById('text-after-style-bar' + folder_id + rulename_id + '_text-decoration')).attr('value','none');
                    $(document.getElementById('text-after-style-bar' + folder_id + rulename_id + '_text-decoration')).css({"background-color": "inherit"});
                }

                if(rule["after"] && rule.after["style"] && rule["after"]["style"]["font-family"]) {
                    document.getElementById('text-after-style-bar' + folder_id + rulename_id + '_font-family').value = rule["after"]["style"]["font-family"];
                }
                
                if(rule["after"] && rule.after["style"] && rule["after"]["style"]["font-size"]) {
                    if(rule["after"]["style"]['font-size'] === "17px") {
                        $(document.getElementById('text-after-style-bar' + folder_id + rulename_id + '_font-size')).val("Small");
                    } else if(rule["after"]["style"]["font-size"] === "22px") {
                        $(document.getElementById('text-after-style-bar' + folder_id + rulename_id + '_font-size')).val("Medium");
                    } else if(rule["after"]["style"]["font-size"] === "30px") {
                        $(document.getElementById('text-after-style-bar' + folder_id + rulename_id + '_font-size')).val("Big");
                    }
                }
                
                

                // box this rule... 
                // alert(rule["container"]);
                if(rule["container"] && rule["container"]["style"]["background-color"]) {
                    $(document.getElementById('box_' + folder_id + rulename_id))[0].checked = true;
                }

                // center this rule ...

                if(rule["container"] && rule["container"]["style"]["text-align"]) {
                 $(document.getElementById('center_' + folder_id + rulename_id))[0].checked = true;
             }

                    // disable everything below the text-after-end-sequence (style text after this rule)
                    if($('#text-after-end-sequence_' + folder_id + rulename_id)[0].value === "" &&
                        $('#newline-text-after_' + folder_id + rulename_id)[0].checked === false) {
                       $('#toolbar_text-after-style-bar' + folder_id + rulename_id)[0].style.visibility = "hidden";
                   $('#span_to_toggle_' + folder_id + rulename_id)[0].style.visibility = "hidden";
               }


           }

           getSubjectRules(document.getElementById(folder_id), folder_id, folder_name, rulename_id);

       }
   }
});




