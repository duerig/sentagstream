#!/usr/bin/env python

import wsgiref.handlers
from google.appengine.ext import webapp
from google.appengine.ext import db
from relation import Relation
from tag import Tag

from django.utils import simplejson as json

class MainHandler(webapp.RequestHandler):

  def get(self):
    self.post()

  def post(self):
#    try:
      self.response.headers.add_header("Access-Control-Allow-Origin", "http://www.jonathonduerig.com");
      user = self.request.get("userid")
      followers = []
      followed = []

      try:
        followers = json.loads(self.request.get("followers"))
      except Exception, error:
        pass
      query = Relation.all()
      query.filter("user = ", user)
      existingFollowers = query.fetch(1000)
      
      try:
        followed = json.loads(self.request.get("followed"))
      except Exception, error:
        pass
      query = Relation.all()
      query.filter("follower = ", user)
      existingFollowed = query.fetch(1000)

      for f in followers:
        self.addRelation(f, user, existingFollowers)
      for f in followed:
        self.addRelation(user, f, existingFollowed)
      self.response.out.write("Success!")
#    except Exception, error:
#      pass

  def addRelation(self, follower, target, existing):
    found = False
    for cur in existing:
      if follower == cur.follower and target == cur.user:
        found = True
        break
      pass
    if not found:
      relation = Relation(follower=follower, user=target)
      relation.put()

      query = Tag.all()
      query.filter("userid = ", target)
      tags = query.fetch(1000)
      for tag in tags:
        tag.addToStream(follower)

def main():
  application = webapp.WSGIApplication([('.*', MainHandler)], debug=True)
  wsgiref.handlers.CGIHandler().run(application)

if __name__ == '__main__':
  main()
