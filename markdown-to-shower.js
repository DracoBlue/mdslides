var converter = new Showdown.converter();

function renderTextAsHtml(response)
{
    var html_content = converter.makeHtml(response);
    
    var has_multiple_h1 = html_content.split('</h2>').length > 1 ? true : false;
    var section_header_tag = 'H2';
    var sub_section_header_tag = 'H3';
    
    if (has_multiple_h1)
    {
        section_header_tag = 'H1';
        sub_section_header_tag = 'H2';
    }
    
    var first_h2_pos = html_content.toUpperCase().indexOf('<' + section_header_tag + '>');

    if (first_h2_pos == -1)
    {
        first_h2_pos = html_content.toUpperCase().indexOf('<' + section_header_tag + ' ');
    }
    
    if (first_h2_pos == -1)
    {
        first_h2_pos = 0;
    }

    var html_content_till_first_h2 = html_content.substr(0, first_h2_pos);
    var html_content_from_first_h2 = html_content.substr(first_h2_pos);

//    console.log('before', html_content_till_first_h2);
//    console.log('after', html_content_from_first_h2);

    var elements = $(html_content_from_first_h2);
    var sections = [];
    var current_section = null;
    var current_section_level = 0;

    $.each(elements, function(pos, element)
    {
        if (section_header_tag == element.nodeName || sub_section_header_tag == element.nodeName)
        {
            if (current_section !== null)
            {
                sections.push(current_section);
            }
            current_section = [];
            
            current_section_level = parseInt(/^H(\d)$/.exec(element.nodeName)[1], 10);
        }
        
        if (section_header_tag == 'H1' && /^H\d$/.exec(element.nodeName))
        {
            var level = parseInt(/^H(\d)$/.exec(element.nodeName)[1], 10);
            var header_element = $('<h' + (level + 2 - current_section_level) + '/>');
            header_element.html($(element).html());
            current_section.push(header_element);
        } else {
            current_section.push(element);
        }
        
    });
    
    if (current_section !== null)
    {
        sections.push(current_section);
    }
    
    var slides = [];
    
    if (has_multiple_h1)
    {
        var slide_element = $('<header class="caption"/>');
        var tmp_element = $('<div />');
        tmp_element.append(sections[0]);
        slide_element.html('<h1>' + tmp_element.find('h2').html() + '</h1>');
        window.document.title = tmp_element.find('h2').text();
        slides.push(slide_element);
    }
    else
    {
        var slide_element = $('<header class="caption"/>');
        slide_element.html(html_content_till_first_h2);
        window.document.title = slide_element.find('h1').text();
        slides.push(slide_element);
    }
    
    $.each(sections, function(pos, section) {
        var slide_element = $('<section class="slide"/>');
        var div_element = $('<div />');
        div_element.append(section);
        slide_element.append(div_element);
        
        if (pos == 0)
        {
            slide_element.attr('id', 'start');
        }
        
        if (slide_element.find('img').length)
        {
            slide_element.addClass('cover');
        }
        
        if (div_element.children().length === 1)
        {
            slide_element.addClass('shout');
        }
        
        slides.push(slide_element);
    });
    
    var progress_element = $('<div class="progress"><div></div></div>');
    slides.push(progress_element);
    
    $('body').empty();
    $('body').append(slides);

    setTimeout(function() {
        $.getScript("template/shower/shower.js");
    }, 10);
};

var url = (document.location.toString().match(/url=(.+)/) || [])[1] || "";
url = decodeURIComponent(url);

if (!url)
{
    alert('No url given, please select one first!');
    document.location = '/';
} else if (url.match(/gist.github.com/)) {
    /* Try gist.github.com/gists/:id */
    var gist_id = (url.match(/gists\/(.+)/) || [])[1] || "";
    if (!gist_id)
    {
        /* Try gist.github.com/:id */
        gist_id = (url.match(/gist\.github\.com\/(.+)/) || [])[1] || "";
    }
    if (!gist_id)
    {
        alert('Invalid gist_id');
        document.location = '/';
    }
    $.ajax({
        'url': 'https://api.github.com/gists/' + gist_id,
        'dataType': 'jsonp',
        'success': function(response) {
            console.log(response.data.files);
            var md_contents = [];
            
            for (var file_name in response.data.files)
            {
                var file = response.data.files[file_name];
                
                
                if (file.language == "Markdown")
                {
                    md_contents.push(file.content);
                    console.log(file.content);
                }
            }
            
            renderTextAsHtml(md_contents.join("\n\n"));
        }
    });
} else {
    $.ajax({
        'url': url,
        'dataType': 'text',
        'success': function(response)
        {
            renderTextAsHtml(response);
        },
        'error': function(response)
        {
            alert('Cannot load remote file (Are you sure it\'s available and Cross-Domain Headers are ok?)!');
            document.location = '/';
        }
    });
}


