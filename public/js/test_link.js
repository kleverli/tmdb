/*
* author: Martin SangDo
 */

var submitting = false;

function begin_get_data(){
    // if (submitting){
    //     return;
    // }

    var main_url = $.trim($('#txt_main_url').val());
    var secondary_url = $.trim($('#txt_secondary_url').val());
    var sel_type = $.trim($('#sel_type').val());

    if (main_url == ''){
        alert('empty url');
        return;
    }
    if (main_url.lastIndexOf('/') == main_url.length-1){
        main_url = main_url.substr(0, main_url.length-1);   //remove last '/'
    }
    var params = {
        domain: main_url,
      url: main_url + secondary_url,
      type: sel_type
    };
    common.dlog(params);
    $('#mess').show();
    $('#total_time').text();
    var start = new Date();
    $('tr.tr_data', $('#tbl_result')).remove();
    submitting = true;
    common.ajaxPost('/test/test_link', params, function(response){
        // response = $.parseJSON(response);
        common.dlog(response);
        fill_data(response);
        $('#total_time').text((new Date()) - start);
        submitting = false;
        $('#mess').hide();
    });
}
//fill data to table
function fill_data(data){
    var len = data.length;
    var $tr;
    for (var i=0; i<len; i++){
        $tr = $('<tr class="tr_data"></tr>');
        $tr.append('<td><img src="'+data[i]['thumb_url']+'" style="max-width:150px;max-height:150px;"</td>');
        $tr.append('<td>'+data[i]['title']+'</td>');
        $tr.append('<td>'+data[i]['slug']+'</td>');
        $tr.append('<td>'+data[i]['author_name']+'</td>');
        $tr.append('<td>'+data[i]['time']+'</td>');
        $tr.append('<td>'+data[i]['excerpt']+'</td>');
        $tr.append('<td>'+data[i]['category_name']+'</td>');
        $tr.append('<td>'+data[i]['comment_num']+'</td>');
        $tr.append('<td>'+data[i]['original_url']+'</td>');
        $tr.append('<td>'+data[i]['category_slug']+'</td>');
        $('#tbl_result').append($tr);
    }
}