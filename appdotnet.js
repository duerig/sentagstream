var globalFeedTimer;
var updateFeedDisplay = true;
var feedBuffer = "";
var feedArray = [];
var userId;

function getUserInfo(uid) {
	uid = typeof uid !== 'undefined' ? uid : 'me';
	endpoint = "https://alpha-api.app.net/stream/0/users/" + uid;

	$.ajax({
		url: endpoint,
		type: "GET",
		data: { access_token: accessToken },
		dataType: "json"
	}).done(function(data) {
		if (data.id.length > 0 && data.name.length > 0) {
			console.log("Current user:");
			console.dir(data);
			currentUser = data;
		        userId = data.id
			$("#user_avatar").attr("src", currentUser.avatar_image.url);
			$("#user_name").html(currentUser.name);
			$("#user_username").html("@" + currentUser.username);
			$("#main").hide();
			$("#main-logged").show("slow");
			updateGlobalFeed();
			$("#main_post").on("keydown", function(event) {
				var current = $("#main_post").val();
				$("#post_counter").html(256 - current.length);
				if (256 - current.length < 0) {
					$("#post_counter").addClass("overage");
				} else {
					$("#post_counter").removeClass("overage");
				}
			});
			$("#post_button").on("click", function(event) {
				if ($("#main_post").val().length > 0) {
					postMessage($("#main_post").val());
				}
			});
		} else {
			console.log("Could not get user info.");
		}
	}).fail(function(req, status) {
		console.log("getUserInfo failed: " + status);
		console.dir(req);
		console.dir(req.getAllResponseHeaders());
	});
}

function updateGlobalFeed() {
	clearTimeout(globalFeedTimer);
	var page = window.location.hash;
//	console.log(page);

	$(".feedtab").parent().removeClass("active");
	switch(page) {
		case "":
		case "#global":
			endpoint = "https://alpha-api.app.net/stream/0/posts/stream/global";
			$("#global-tab").parent().addClass("active");
			break;
		case "#personal":
			endpoint = "https://alpha-api.app.net/stream/0/posts/stream";
			$("#personal-tab").parent().addClass("active");
			break;
		case "#mentions":
			endpoint = "https://alpha-api.app.net/stream/0/users/" + currentUser.id + "/mentions";
			$("#mentions-tab").parent().addClass("active");
			break;
		default:
			hashtag = window.location.hash.substr(1);
			endpoint = "https://alpha-api.app.net/stream/0/posts/tag/" + hashtag;
			console.log("Adding active class to " + hashtag + "-tab");
			var thisTab = document.getElementById(hashtag + "-tab");
			$(thisTab).addClass("active");
	}

	console.log(endpoint);

	if (updateFeedDisplay) {
		if (feedBuffer.length > 0) {
			$('<div></div>', {
				html: feedBuffer
			}).prependTo($("#global-tab-container")).show("slow");
			feedBuffer = "";
		}
	}

	var params = new Object;

	params.access_token = accessToken;

	if ($("#global-tab-container").children().length > 0) {
		params.min_id = ($("#global-tab-container").children()[0].id).split("|")[1];
	}

	$.get(endpoint, params, function(data) {
		if (data.length > 0) {
			for (var i = data.length - 1; i > -1; i--) {
				if (!document.getElementById("post|" + data[i].id) && data[i].text !== null) {
				    feedArray[i] = data[i];
					// this is an unseen post

					// start qBot
					/*
					if (data[i].text.substr(0, 4) === "@q $") {
						console.log("Quote requested!");
						var symbol = data[i].text.substring(4);
						$.get("http://www.quickapplabs.com/dev/stockquote.php?symbol=" + symbol, function(data) {
							//console.dir(data);
							postMessage("Last quote for " + data[0].t + ": " + data[0].l);
						}, "json");
					}
					*/
					// end qBot 

					//console.dir(data[i]);
					var urlRegex = /\b((?:[a-z][\w-]+:(?:\/{1,3}|[a-z0-9%])|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:'".,<>?«»“”‘’]))/i;
					var htmlText = htmlEncode(data[i].text);
					var body = htmlText.replace(urlRegex, "<a href='$1' target='_blank'>$1</a>");
					var connectionClass = "";
					for (var j = 0; j < data[i].entities.mentions.length; j++) {
						if (data[i].entities.mentions[j].id === currentUser.id) {
							connectionClass = " single-connected";
						}
					}
					var formattedPost = "<div class='appNetPostAvatar'><img src='" + data[i].user.avatar_image.url + "' width='45' height='45'></div>" +
									    "<div class='appNetPostBody'><span class='appNetPostUsername'><strong>@" + data[i].user.username + "</strong></span> " + body +	"</div>" +
										"<div class='appNetPostFooter'><span class='appNetPostTimestamp' id='posttime|" + data[i].id + "|" + data[i].created_at + "'>" + $.easydate.format_date(new Date(data[i].created_at)) + "</span> <a class='appNetPostFooterLink' href='#'>Remember</a> <a class='appNetPostFooterLink repostButton' id='repost|" + data[i].id +"|" + i + "' href='#'>Share</a> <a class='appNetPostFooterLink replyButton' id='reply|" + data[i].id +"' href='#'>Reply</a>";
					if (data[i].reply_to) {
						formattedPost += "<a class='appNetPostFooterLink' href='https://alpha.app.net/" + data[i].user.username + "/post/" + data[i].id + "' target='_blank'>Read more...</a>";
					}
					formattedPost += "</div>";
					formattedPost += "<div id='replycontainer|" + data[i].id + "' class='replyContainer'>" +
									 "<textarea id='replyfield|" + data[i].id + "' class='replyField'></textarea>" +
									 "<button id='replybutton|" + data[i].id + "' class='post_button btn replySendButton'>Post</button>" +
									 "<div class='replycounter' id='replycounter|" + data[i].id + "'>256</div>" +
									 "</div>";		

					// parse @-names and #-tags and link them appropriately
					var atNameRegex  = /@([A-Za-z0-9_]+)/g;
					var hashtagRegex = /#([A-Za-z0-9_]+)/g;
					var repostRegex  = /([RP @|RT @|>> @]+)/g;

					formattedPost = formattedPost.replace(atNameRegex, "<a href='https://alpha.app.net/$1' target='_blank'>@$1</a>").replace(hashtagRegex, "<a href='#' class='appNetPostHashtag'>#$1</a>");

					if (updateFeedDisplay) {
						$('<div></div>', {
							id: 'post|' + data[i].id,
							class: 'appNetPost' + connectionClass,
							html: formattedPost
						}).prependTo($("#global-tab-container")).show("slow");
						
					} else {
						if (feedBuffer.indexOf("<div id=\"post|" + data[i].id) === -1) {
							feedBuffer = '<div id="post|' + data[i].id + '" class="appNetPost' + connectionClass + '">' + formattedPost + '</div>' + feedBuffer;
						}					
					}					
				} 
			}
		}
		updateTimes();
		globalFeedTimer = setTimeout("updateGlobalFeed()", 10000);
	});
}

function getOlderPosts(max_id) {
	clearTimeout(globalFeedTimer);
	var page = window.location.hash;
//	console.log(page);

	$(".feedtab").parent().removeClass("active");
	switch(page) {
		case "":
		case "#global":
			endpoint = "https://alpha-api.app.net/stream/0/posts/stream/global";
			$("#global-tab").parent().addClass("active");
			break;
		case "#personal":
			endpoint = "https://alpha-api.app.net/stream/0/posts/stream";
			$("#personal-tab").parent().addClass("active");
			break;
		case "#mentions":
			endpoint = "https://alpha-api.app.net/stream/0/users/" + currentUser.id + "/mentions";
			$("#mentions-tab").parent().addClass("active");
			break;
		default:
			hashtag = window.location.hash.substr(1);
			endpoint = "https://alpha-api.app.net/stream/0/posts/tag/" + hashtag;
			console.log("Adding active class to " + hashtag + "-tab");
			var thisTab = document.getElementById(hashtag + "-tab");
			$(thisTab).addClass("active");
	}

	console.log(endpoint);

	var params = new Object;

	params.access_token = accessToken;
	params.max_id = max_id;

	$.get(endpoint, params, function(data) {
		if (data.length > 0) {
			for (var i = 0; i < data.length; i++) {
				if (!document.getElementById("post|" + data[i].id) && data[i].text !== null) {
					// this is an unseen post

					//console.dir(data[i]);
					var urlRegex = /\b((?:[a-z][\w-]+:(?:\/{1,3}|[a-z0-9%])|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:'".,<>?«»“”‘’]))/i;
					var htmlText = htmlEncode(data[i].text);
					var body = htmlText.replace(urlRegex, "<a href='$1' target='_blank'>$1</a>");
					var connectionClass = "";
					for (var j = 0; j < data[i].entities.mentions.length; j++) {
						if (data[i].entities.mentions[j].id === currentUser.id) {
							connectionClass = " single-connected";
						}
					}
					var formattedPost = "<div class='appNetPostAvatar'><img src='" + data[i].user.avatar_image.url + "' width='45' height='45'></div>" +
									    "<div class='appNetPostBody'><span class='appNetPostUsername'><strong>@" + data[i].user.username + "</strong></span> " + body +	"</div>" +
										"<div class='appNetPostFooter'><span class='appNetPostTimestamp' id='posttime|" + data[i].id + "|" + data[i].created_at + "'>" + $.easydate.format_date(new Date(data[i].created_at)) + "</span> <a class='appNetPostFooterLink' href='#'>Remember</a> <a class='appNetPostFooterLink repostButton' id='repost|" + data[i].id +"' href='#'>Repost</a> <a class='appNetPostFooterLink replyButton' id='reply|" + data[i].id +"' href='#'>Reply</a>";
					if (data[i].reply_to) {
						formattedPost += "<a class='appNetPostFooterLink' href='https://alpha.app.net/" + data[i].user.username + "/post/" + data[i].id + "' target='_blank'>Read more...</a>";
					}
					formattedPost += "</div>";
					formattedPost += "<div id='replycontainer|" + data[i].id + "' class='replyContainer'>" +
									 "<textarea id='replyfield|" + data[i].id + "' class='replyField'></textarea>" +
									 "<button id='replybutton|" + data[i].id + "' class='post_button btn replySendButton'>Post</button>" +
									 "<div class='replycounter' id='replycounter|" + data[i].id + "'>256</div>" +
									 "</div>";		

					// parse @-names and #-tags and link them appropriately
					var atNameRegex  = /@([A-Za-z0-9_]+)/g;
					var hashtagRegex = /#([A-Za-z0-9_]+)/g;
					var repostRegex  = /([RP @|RT @|>> @]+)/g;

					formattedPost = formattedPost.replace(atNameRegex, "<a href='https://alpha.app.net/$1' target='_blank'>@$1</a>").replace(hashtagRegex, "<a href='#' class='appNetPostHashtag'>#$1</a>");

					$('<div></div>', {
						id: 'post|' + data[i].id,
						class: 'appNetPost' + connectionClass,
						html: formattedPost
					}).appendTo($("#global-tab-container")).show("slow");
						
				} 
			}
		}
		updateTimes();
		globalFeedTimer = setTimeout("updateGlobalFeed()", 10000);		
	});	
}

function postMessage(messageString) {
	console.log("postMessage called.  Message: " + messageString);
	$.post("https://alpha-api.app.net/stream/0/posts", { text: messageString, access_token: accessToken }, function(data) {
		console.dir(data);
	});

	$("#post_counter").html("256");
	$("#main_post").val("");
	updateGlobalFeed();
}

function postReply(messageString, inReplyTo) {
	console.log("postReply called.  Message: " + messageString + " In Reply To: " + inReplyTo);
	$.post("https://alpha-api.app.net/stream/0/posts", { text: messageString, reply_to: inReplyTo, access_token: accessToken }, function(data) {
		console.dir(data);
	});
	updateGlobalFeed();	
}

function updateTimes() {
	$('.appNetPostTimestamp').each(function(index) {
		var originalTimestamp = $(this)[0].id.split("|")[2];
		$(this).html($.easydate.format_date(new Date(originalTimestamp)));
	});
}

function htmlEncode(value){
    if (value) {
        return jQuery('<div />').text(value).html();
    } else {
        return '';
    }
}
 
function htmlDecode(value) {
    if (value) {
        return $('<div />').html(value).text();
    } else {
        return '';
    }
}