from google.appengine.ext import db

class Relation(db.Model):
    follower = db.StringProperty(default="")
    user = db.StringProperty(default="")
