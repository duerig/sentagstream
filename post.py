from google.appengine.ext import db

class Post(db.Model):
    postid = db.StringProperty(default="")
    post = db.TextProperty(default="")
