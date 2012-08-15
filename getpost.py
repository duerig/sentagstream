#!/usr/bin/env python

import wsgiref.handlers
from google.appengine.ext import webapp
from google.appengine.ext import db
from post import Post
from relation import Relation
from stream import Stream
from tag import Tag

from django.utils import simplejson as json

class MainHandler(webapp.RequestHandler):

  def get(self):
      self.post()

  def post(self):
      self.response.headers.add_header("Access-Control-Allow-Origin", "http://www.jonathonduerig.com");
      postid = self.request.get("postid")
      userid = self.request.get("userid")
      posts = []
      followed = []
      if postid:
          query = Post.all()
          query.filter("postid = ", postid)
          posts = query.fetch(1000)
      elif userid:
          query = Stream.all()
          query.filter("userid = ", userid)
          query.order("-created")
          posts = query.fetch(30)
          query = Relation.all()
          query.filter("follower = ", userid)
          followed = query.fetch(1000)
      resultList = []
      for p in posts:
          resultTags = []
          postkey = ""
          outPostid = ""
          if postid:
              postkey = p.key()
              outPostid = postid
          else:
              postkey = p.postkey.key()
              outPostid = p.postkey.postid
          query = Tag.all()
          query.filter("postkey = ", postkey)
          tags = query.fetch(1000)
          for t in tags:
            found = False
            for f in followed:
              if t.userid == f.user:
                found = True
                break
              pass
            if found or postid:
              tag = {'user': t.userid,
                     'key': t.tag_key,
                     'value': t.tag_value}
              resultTags.append(tag)
            pass
          resultList.append({'postid': outPostid, 'post': p.post,
                             'tags': resultTags})
      resultStr = json.dumps(resultList, sort_keys=True,
                             indent=2)
      self.response.out.write(resultStr)

def main():
  application = webapp.WSGIApplication([('.*', MainHandler)], debug=True)
  wsgiref.handlers.CGIHandler().run(application)

if __name__ == '__main__':
  main()
