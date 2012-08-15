#!/usr/bin/env python

import wsgiref.handlers
from google.appengine.ext import webapp
from google.appengine.ext import db
from post import Post
from relation import Relation
from tag import Tag

from django.utils import simplejson as json

class MainHandler(webapp.RequestHandler):

  def get(self):
      self.post()

  def post(self):
      self.response.headers.add_header("Access-Control-Allow-Origin", "http://www.jonathonduerig.com");
      postid = self.request.get("postid")
      post = self.request.get("post")
      user = self.request.get("user")
      key = self.request.get("key")
      value = self.request.get("value")
      query = Post.all()
      query.filter("postid = ", postid)
      postResult = query.fetch(1000)
      post = Post(postid=postid, post=post)
      if len(postResult) > 0:
          post = postResult[0]
      else:
          post.put()
      tag = Tag(userid=user, postkey=post.key(), tag_key=key, tag_value=value)
      tag.put()
      query = Relation.all()
      query.filter("user = ", user)
      followers = query.fetch(1000)
      for f in followers:
          tag.addToStream(f.follower)
      self.response.out.write("Tagged post " + postid + " with " + user + ":" +
                              key + "=" + value)

def main():
  application = webapp.WSGIApplication([('.*', MainHandler)], debug=True)
  wsgiref.handlers.CGIHandler().run(application)

if __name__ == '__main__':
  main()
