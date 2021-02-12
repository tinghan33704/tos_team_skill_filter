const tool_id = 'team_skill';

let filter_set = new Set();
let or_filter = true;
let keyword_search = false;
let theme = 'normal';
let display_mode = 'row';

$(document).ready(function(){
    init();
    
    location.search && readUrl();
});

function startFilter()
{
    changeUrl();
    
    let skill_set = new Set();
    let attr_set = new Set();
    let race_set = new Set();
    let star_set = new Set();
    let activate_set = new Set();
    
    let isSkillSelected = false;
    let isAttrSelected = false;
    let isRaceSelected = false;
    let isStarSelected = false;
    let isActivateSelected = false;
    
    if(keyword_search == false)
    {
        filter_set.clear();
    
        [skill_set, isSkillSelected] = getSelectedButton('filter');
        [attr_set, isAttrSelected] = getSelectedButton('attr');
        [race_set, isRaceSelected] = getSelectedButton('race');
        [star_set, isStarSelected] = getSelectedButton('star', true);
        [activate_set, isActivateSelected] = getSelectedButton('activate');
        
        $.each(monster_data, (index, monster) => {
            if( (!monster.star || monster.star <= 0) ||
                (isAttrSelected && !attr_set.has(monster.attribute)) || 
                (isRaceSelected && !race_set.has(monster.race)) || 
                (isStarSelected && !star_set.has(monster.star))) return;
                
            if(isSkillSelected) {
                let skill_num_array = [];
                
                $.each(monster.team_skill, (skill_index, monster_skill) => {
                    if(isActivateSelected && !hasActivateTag(activate_set, monster_skill)) return;
                    
                    if(or_filter)       // OR
                    {
                        let isSkillMatch = false;
                        $.each([...skill_set], (skill_set_index, selected_feat) => {
                            if(monster_skill.skill_tag.includes(selected_feat)) {
                                isSkillMatch = true;
                                return false;
                            }
                        })
                        
                        if(!isSkillMatch) return;
                    }
                    else       // AND
                    {
                        let isSkillMatch = true;
                        
                        $.each([...skill_set], (skill_set_index, selected_feat) => {
                            if(!(monster_skill.skill_tag.includes(selected_feat))) {
                                isSkillMatch = false;
                                return false;
                            }
                        })
                        
                        if(!isSkillMatch) return;
                    }
                    
                    skill_num_array.push(skill_index);
                })
                
                if(skill_num_array.length > 0) filter_set.add({'id': monster.id, 'nums': skill_num_array});
            }
            else {
                let skill_num_array = [];
                
                $.each(monster.team_skill, (skill_index, monster_skill) => {
                    if(isActivateSelected && !hasActivateTag(activate_set, monster_skill)) return;
                    
                    skill_num_array.push(skill_index);
                })
                
                if(skill_num_array.length > 0) filter_set.add({'id': monster.id, 'nums': skill_num_array});
            }
        })
    }
    else        // keyword search mode
    {
        filter_set.clear();
    
        let keyword_set = checkKeyword();
        if(!keyword_set) return;
        
        [attr_set, isAttrSelected] = getSelectedButton('attr');
        [race_set, isRaceSelected] = getSelectedButton('race');
        [star_set, isStarSelected] = getSelectedButton('star', true);
        [activate_set, isActivateSelected] = getSelectedButton('activate');
        
        $.each(monster_data, (index, monster) => {
            if( (!monster.star || monster.star <= 0) ||
                (isAttrSelected && !attr_set.has(monster.attribute)) || 
                (isRaceSelected && !race_set.has(monster.race)) || 
                (isStarSelected && !star_set.has(monster.star))) return;
            
            let skill_num_array = [];
            $.each(monster.team_skill, (skill_index, monster_skill) => {
                if(isActivateSelected && !hasActivateTag(activate_set, monster_skill)) return;
                
                if(or_filter)
                {
                    let isKeywordChecked = false;
                    let skill_desc = textSanitizer(monster_skill.description);
                    
                    $.each([...keyword_set], (keyword_index, keyword) => {
                        if(skill_desc.includes(keyword))
                        {
                            isKeywordChecked = true;
                            return false;
                        }
                    })
                    
                    if(!isKeywordChecked) return;
                }
                else
                {
                    let isKeywordChecked = true;
                    let skill_desc = textSanitizer(monster_skill.description);
                    
                    $.each([...keyword_set], (keyword_index, keyword) => {
                        if(!skill_desc.includes(keyword))
                        {
                            isKeywordChecked = false;
                            return false;
                        }
                    })
                    
                    if(!isKeywordChecked) return;
                }
                
                skill_num_array.push(skill_index);
            })
            
            if(skill_num_array.length > 0) filter_set.add({'id': monster.id, 'nums': skill_num_array});
        })
    }
    
    $(".row.result-row").show();
    
    let monster_array = [...filter_set];
    
    $("#result-row").html(function()
    {
        var str = "";
        if(monster_array.length != 0)
        {
            // Block view
            
            str += `
                    <div class="col-12">
                        <div class="row result_block_view">
            `;
            $.each(monster_array, (index, monster) => {
                str += renderMonsterImage(monster);
            });
            str += `
                    </div>
                </div>
            `;
            
            
            // Row view
            
            str += `
                <div class="col-12">
                    <div class="row result_row_view">
                        <table class="table result_table">
            `;
            
            $.each(monster_array, (index, monster) => {
                let monster_attr = monster_data.find((element) => {
                    return element.id == monster.id;
                }).attribute;
                
                $.each(monster.nums, (num_index, skill_number) => {
                    let skill = monster_data.find((element) => {
                        return element.id == monster.id;
                    }).team_skill[skill_number];
                    
                    if(num_index == 0)
                    {
                        str += `
                            <tr class="monster_first_tr monster_tr_${attr_zh_to_en[monster_attr]}">
                                <td class="td_monster_icon" rowspan=${monster.nums.length*2}>
                                    <a href="https://tos.fandom.com/zh/wiki/${monster.id}" target="_blank">
                                        <img class="monster_img" src="../tos_tool_data/img/monster/${monster.id}.png" title="${monster.id}" onerror="this.src='../tos_tool_data/img/monster/noname_${attr_zh_to_en[monster_attr]}.png'"></img>
                                        <div class="monsterId">${paddingZeros(monster.id, 3)}</div>
                                    </a>
                                </td>`;
                    }
                    else {
                        str += `
                            <tr class="monster_tr monster_tr_${attr_zh_to_en[monster_attr]}">
                        `;
                    }
                    
                    str += `
                                <td class="td_description">
                                    ${skill.description}
                                </td>
                                <td class="td_activate">
                                    ${skill.activate}
                                </td>
                            </tr>
                            <tr>
                                <td colspan=2 class="td_relative monster_tr_${attr_zh_to_en[monster_attr]}">
                    `
                                
                    $.each(skill.relative, (relative_index, relative_monster) => {
                        let monster_attr = monster_data.find(function(element){
                            return element.id == relative_monster;
                        }).attribute;
                        
                        str += `
                                    <img class="relative_img" src="../tos_tool_data/img/monster/${relative_monster}.png" title="${relative_monster}" onerror="this.src='../tos_tool_data/img/monster/noname_${attr_zh_to_en[monster_attr]}.png'">
                                    </img>
                        `;
                    })
                    
                    str += `
                                </td>
                            </tr>
                    `;
                })
            });
            
                
            str += `
                            <tr class="monster_first_tr">
                                <td colspan=3></td>
                            </tr>
                
                        </table>
                    </div>
                </div>
            `;
        }
        else
        {
            str = `<div class='col-12' style="padding-top: 20px; text-align: center; color: #888888;"><h1>查無結果</h1></div>`;
        }
        return str;
    });
    
    $('.result').tooltip({ 
        boundary: 'scrollParent', 
        placement: 'auto', 
        container: 'body'
    });
    
    if(display_mode == 'row') $('.result_block_view').hide();
    else $('.result_row_view').hide();
    
    $(".search_tag").html(() => {
        let tag_html = "";
        
        tag_html += (!keyword_search) ? renderTags(skill_set, 'skill') : '';
        tag_html += renderTags(activate_set, 'genre');
        tag_html += renderTags(attr_set, 'genre', '屬性');
        tag_html += renderTags(race_set, 'genre');
        tag_html += renderTags(star_set, 'genre', ' ★');
        
        return tag_html;
    });
    
    
    $('[data-toggle=popover]').popover({
      container: 'body',
      html: true,
      trigger: 'focus',
      placement: 'bottom'
    });
    
    jumpTo("result_title");
}

function renderMonsterImage(monster) {
    const monster_attr = monster_data.find((element) => {
        return element.id == monster.id;
    }).attribute;
    
    return `
        <div class='col-3 col-md-2 col-lg-1 result'>
            <img class='monster_img' src='../tos_tool_data/img/monster/${monster.id}.png' onerror='this.src="../tos_tool_data/img/monster/noname_${attr_zh_to_en[monster_attr]}.png"'></img>
            <div class='monsterId'>
                <a href='https://tos.fandom.com/zh/wiki/${monster.id}' target='_blank'>${paddingZeros(monster.id, 3)}</a>
            </div>
        </div>
    `;
}

function hasActivateTag(activate_set, monster_skill) {
    let hasActivateTag = false
    $.each(monster_skill.activate_tag, (tag_index, tag) => {
        if(activate_set.has(tag)) {
            hasActivateTag = true;
            return false;
        }
    })
    
    return hasActivateTag;
}

function displaySwitch()
{
    $(`.result_${display_mode}_view`).hide();
    
    display_mode = display_mode == "block" ? "row" : "block"
    $(`#switch_display`).html(display_mode == "block" ? `<i class="fa fa-th-large"></i>` : `<i class="fa fa-list-ul"></i>`);
    $(`.result_${display_mode}_view`).show();
}

function changeUrl()
{
    let search_str = `${!keyword_search ? `search=${encode(".filter-row", skill_num)}` : `keyword=${escape(textSanitizer($('#keyword-input').val()))}`}`
    let attr_str = `attr=${encode(".attr-row", attr_num)}`
    let race_str = `race=${encode(".race-row", race_num)}`
    let star_str = `star=${encode(".star-row", star_num)}`
    let active_str = `actv=${encode(".activate-row", activate_num)}`
    let or_str = `or=${or_filter ? `1` : `0`}`
    
    window.history.pushState(null, null, `?${search_str}&${attr_str}&${race_str}&${star_str}&${active_str}&${or_str}`);
}

function readUrl()
{   
    let code_array = location.search.split("&").map(x => x.split("=")[1]);
    let code_name_array = location.search.split("?")[1].split("&").map(x => x.split("=")[0]);
    
    if(code_array.length != 6)
    {
        errorAlert(1);
        return;
    }
    
    let code_name_1 = ["search", "attr", "race", "star", "actv", "or"];
    let code_name_2 = ["keyword", "attr", "race", "star", "actv", "or"];
    
    let isCodeNameFit = true;
    $.each(code_name_array, (index, code) => {
        if( code_name_array[index] !== code_name_1[index] && 
            code_name_array[index] !== code_name_2[index] )
        {
            isCodeNameFit = false;
            return false;
        }
    })
    
    if(!isCodeNameFit) {
        errorAlert(1);
        return;
    }
    
    
    if(code_name_array[0] === code_name_1[0])
    {
        let skill_code = decode(code_array[0]);
        setButtonFromUrl(".filter-row", skill_code, clearFilterButtonRow('filter'));
    }
    else
    {
        let skill_keyword = code_array[0];
        setInputFromUrl(".keyword-input", unescape(skill_keyword));
        
        $("#keyword-switch").click();
        keywordSwitch();
    }
    
    let attr_code = decode(code_array[1]);
    setButtonFromUrl(".attr-row", attr_code, clearFilterButtonRow('attr'));
    
    let race_code = decode(code_array[2]);
    setButtonFromUrl(".race-row", race_code, clearFilterButtonRow('race'));
    
    let star_code = decode(code_array[3]);
    setButtonFromUrl(".star-row", star_code, clearFilterButtonRow('star'));
    
    let actv_code = decode(code_array[4]);
    setButtonFromUrl(".active-row", actv_code, clearFilterButtonRow('active'));
    
    let and_or_code = code_array[5];
    and_or_code[0] == "0" && andOrChange();
    
    
    startFilter();
    
    window.history.pushState(null, null, location.pathname);    // clear search parameters
}