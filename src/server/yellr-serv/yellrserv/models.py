import os
import json
import uuid
import datetime
from time import strftime
from random import randint

import transaction

from sqlalchemy import (
    Column,
    Index,
    Integer,
    Text,
    DateTime,
    Boolean,
    Float,
    CHAR,
    )

from sqlalchemy import ForeignKey

from sqlalchemy.ext.declarative import declarative_base

from sqlalchemy.orm import (
    scoped_session,
    sessionmaker,
    )

from zope.sqlalchemy import ZopeTransactionExtension

DBSession = scoped_session(sessionmaker(extension=ZopeTransactionExtension(),expire_on_commit=False))
Base = declarative_base()

#class MyModel(Base):
#    __tablename__ = 'models'
#    id = Column(Integer, primary_key=True)
#    name = Column(Text)
#    value = Column(Integer)

#Index('my_index', MyModel.name, unique=True, mysql_length=255)

class UserTypes(Base):

    """
    Different types of users.  Administrators have the most access/privs,
    Moderators have the next leve, Subscribers the next, and then users only
    have the ability to post and view.
    """

    __tablename__ = 'usertypes'
    user_type_id = Column(Integer, primary_key=True)
    name = Column(Integer)
    description = Column(Text)

    @classmethod
    def get_from_value(cls, session, name):
        with transaction.manager:
            user_type = session.query(
                UserTypes
            ).filter(
                UserTypes.name == name
            ).first()
        return user_type

class Users(Base):

    """
    This is the user table.  It holds information for administrators, moderators,
    subscribers, and users.  If the type is a user, than a uniqueid is used to
    idenfity them.  if the user wants to be verified then, then the rest of the
    information is used.  All fields are used for admins, mods, and subs.
    """
    
    __tablename__ = 'users'
    user_id = Column(Integer, primary_key=True)
    user_type_id = Column(Integer, ForeignKey('usertypes.user_type_id'))
    verified = Column(Boolean)
    unique_id = Column(Text)
    first_name = Column(Text)
    last_name = Column(Text)
    organization = Column(Text)
    email = Column(Text)
    pass_salt = Column(Text)
    pass_hash = Column(Text)

    @classmethod
    def create_new_user(cls, session, user_type_id, client_id,
            verified=False, first_name='', last_name='', email='',
            organization='', pass_salt=randint(10000,99999), 
            pass_hash=''):
        user = None
        with transaction.manager:
            user = cls(
                user_type_id = user_type_id,
                verified = verified,
                unique_id = client_id,
                first_name = first_name,
                last_name = last_name,
                organization = organization,
                email = email,
                pass_salt = pass_salt,
                pass_hash = pass_hash,
            )
            session.add(user)
            transaction.commit()
            # Debug/Log
            #eventdetails = {
            #    'eventtype': 'user_creation',
            #    'clientid': clientid,
            #    'datetime': str(strftime("%Y-%m-%d %H:%M:%S")),
            #}
            #ClientLogs.log(session,clientid,json.dumps(eventdetails))
        return user

    @classmethod
    def get_from_uniqueid(cls, session, unique_id):
        user = None
        with transaction.manager:
            user = session.query(
                Users
            ).filter(
                Users.unique_id == unique_id
            ).first()
            created = False
            if user == None:
                user_type = UserTypes.get_from_value(session,name='user')
                user = cls.create_new_user(session,
                        user_type.user_type_id,unique_id)
                created = True
        return (user, created)

class Assignments(Base):

    """
    An assignment is created by a moderator and available for users to pull down.
    Assignments hold a publish date, an experation date, and a geofence (geojson)
    within them, as well as a user id to tie it to a specific user.
    """

    __tablename__ = 'assignments'
    assignment_id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.user_id'))
    publish_datetime = Column(DateTime)
    expire_datetime = Column(DateTime)
    fence_geojson = Column(Text)

    @classmethod
    def get_by_assignmentid(cls, session, assignment_id):
        assignment = session.query(
            QuestionAssignments
        ).filter(
            QuestionAssignments.assignemnt_id == assignemnt_id
        ).first()
        return assignment

    @classmethod
    def get_with_question(cls, session, assignment_id, language_id):
        assignment = Assignments.get_by_assignmentid(session,assignment_id)
        question = session.query(
            Questions
        ).join(
            Questions,QuestionAssignments.question_id
        ).filter(
            QuestionAssignments.assignemnt_id == assignemnt_id,
            Questions.language_id == language_id
        ).filter().first()
        return (assignment,question)
            

class Questions(Base):

    """
    A list of questions that assignments are tied to.  Each question has a language with
    it, thus the same question in multiple languages may exist.  There are 10 possible
    answer fields as to keep our options open.  Question type is used by the client
    on how to display the answer fields.
    """

    __tablename__ = 'questions'
    question_id = Column(Integer, primary_key=True)
    language_id = Column(Integer, ForeignKey('languages.language_id'))
    question_text = Column(Text)
    question_type = Column(Integer)
    answer0 = Column(Text)
    answer1 = Column(Text)
    answer2 = Column(Text)
    answer3 = Column(Text)
    answer4 = Column(Text)
    answer5 = Column(Text)
    answer6 = Column(Text)
    answer7 = Column(Text)
    answer8 = Column(Text)
    answer9 = Column(Text)

class QuestionAssignments(Base):

    """
    This table holds the connection between assignments and questions.  There can be
    multiple questions per assignment due to naturalization (multiple languages, same
    question).
    """

    __tablename__ = 'questionassignmenets'
    question_assignment_id = Column(Integer, primary_key=True)
    assignemnt_id = Column(Integer, ForeignKey('assignments.assignment_id'))
    question_id = Column(Integer, ForeignKey('questions.question_id'))

class Languages(Base):

    """
    List of available languages.  The client is responciple for picking whicg language
    it wants.
    """

    __tablename__ = 'languages'
    language_id = Column(Integer, primary_key=True)
    language_code = Column(Text)
    name = Column(Text)

    @classmethod
    def get_from_code(cls, session, language_code):
        language = session.query(
            Languages
        ).filter(
            Languages.language_code == language_code
        ).first()
        return language

class Posts(Base):

    """
    These are the posts by users.  They can be unsolicited, or associated with a 
    assignment.  The post has the users id, the optional assignment id, date/time
    language, and the lat/lng of the post.  There is a boolean option for flagging
    the post as 'innapropreate'.
    """

    __tablename__ = 'posts'
    post_id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.user_id'))
    assignment_id = Column(Integer, ForeignKey('assignments.assignment_id'))
    post_datetime = Column(DateTime)
    language_id = Column(Integer, ForeignKey('languages.language_id'))
    reported = Column(Boolean)
    lat = Column(Float)
    lng = Column(Float)

    @classmethod
    def create_from_http(cls, session, client_id, assignment_id,
            language_code, location={'lat':0,'lng':0}, media_objects=[]):
        # create post
        with transaction.manager:
            language = Languages.get_from_code(session,language_code)
            if assignment_id == None \
                   or assignment_id == '' \
                   or assignment_id == 0:
                assignment_id = None
            user,created = Users.get_from_uniqueid(session,client_id)
            post = cls(
                user_id = user.user_id,
                assignment_id = assignment_id,
                post_datetime = datetime.datetime.now(),
                language_id = language.language_id,
                reported = False,
                lat = location['lat'],
                lng = location['lng'],
            )
            session.add(post)
            transaction.commit()
        # assign media objects to the post
        with transaction.manager:
            for media_object_unique_id in media_objects:
                media_object = MediaObjects.get_from_uniqueid(
                    session,media_object_unique_id
                )
                post_media_object = PostMediaObjects(
                    post_id = post.post_id,
                    media_object_id = media_object.media_object_id,
                )
                session.add(post_media_object)
            transaction.commit()
        return (post, created)

class PostViews(Base):

    """
    This holds the event of a moderator or subscriber viewing a users post.  This
    is a nice way to give feedback to the user that someone is actually looking at
    their content.
    """

    __tablename__ = 'postviews'
    post_view_id = Column(Integer, primary_key=True)
    viewing_user_id = Column(Integer, ForeignKey('users.user_id'))
    post_id = Column(Integer, ForeignKey('posts.post_id'))
    view_datetime = Column(DateTime)
    acknowledged = Column(Boolean)

    @classmethod
    def create_new_postview(cls, session, viewing_user_id, post_id):
        with transaction.manager:
            postview = cls(
                viewing_user_id = viewing_user_id,
                post_id = post_id,
                view_datetime = datetime.datetime.now(),
                acknowledged = False,
            )
        return postview

    @classmethod
    def get_unacknowledged_from_uniqueid(cls, session, unique_id):
        with transaction.manager:
            user = Users.get_from_unique_id(unique_id)
            postviews = session.query(
                PostViews
            ).join(
                PostViews, Posts.post_id,
            ).filter(
                Posts.user_id == user.user_id,
                PostViews.acknowledged == False,
            )
        return postviews

class MediaTypes(Base):

    """
    These are the differnet types of media.  Audio, Video, Image, and Text.
    """

    __tablename__ = 'mediatypes'
    media_type_id = Column(Integer, primary_key=True)
    name = Column(Text)
    description = Column(Text)

    @classmethod
    def from_value(cls, session, name):
        with transaction.manager:
            media_type = session.query(
                MediaTypes,
            ).filter(
                MediaTypes.name == name,
            ).first()
        return media_type

class MediaObjects(Base):

    """
    Media objects are attached to a post.  A post can have any number of media objects.
    """

    __tablename__ = 'mediaobjects'
    media_object_id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.user_id'))
    media_type_id = Column(Integer, ForeignKey('mediatypes.media_type_id'))
    unique_id = Column(Text)
    file_name = Column(Text)
    caption = Column(Text)
    media_text = Column(Text)

    @classmethod
    def get_from_uniqueid(cls, session, unique_id):
        with transaction.manager:
            mediaobject = session.query(
                MediaObjects,
            ).filter(
                MediaObjects.unique_id == unique_id,
            ).first()
        return mediaobject

    @classmethod
    def create_new_media_object(cls, session, client_id, media_type_value, 
            file_name, caption, text):
        with transaction.manager:
            user,created = Users.get_from_uniqueid(session,client_id)
            mediatype = MediaTypes.from_value(session,media_type_value)
            mediaobject = cls(
                user_id = user.user_id,
                media_type_id = mediatype.media_type_id,
                unique_id = str(uuid.uuid4()),
                file_name = file_name,
                caption = caption,
                media_text = text,
            )
            session.add(mediaobject)
            transaction.commit()
        return mediaobject

class PostMediaObjects(Base):

    """
    There can be multiple media objects associated with a post, thus this table allows
    for the linking of multiple media objects to a single post id.
    """

    __tablename__ = 'postmediaobjects'
    post_media_object_id = Column(Integer, primary_key=True)
    post_id = Column(Integer, ForeignKey('posts.post_id'))
    media_object_id = Column(Integer)

    @classmethod
    def create_new_postmediaobject(cls, session, post_id, media_object_id):
        with transaction.manager:
            post_media_object = cls(
                post_id = post_id,
                media_object_id = media_objectid,
            )

class ClientLogs(Base):

    """
    This is used as a debugging tool to keep track of how the application is
    being used, and how often clients are accessing the website.
    """

    __tablename__ = 'clientlogs'
    client_log_id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.user_id'))
    event_datetime = Column(DateTime)
    details = Column(Text)

    @classmethod
    def log(cls, session, client_id, details):
        with transaction.manager:
            user,created = Users.get_from_uniqueid(session,client_id)
            clientlog = ClientLogs(
                user_id = user.user_id,
                event_datetime = datetime.datetime.now(),
                details = details,
            )
            session.add(clientlog)
        return clientlog

class Collections(Base):

    """
    Collections are a means to organize posts, and are used by moderators and
    subscribers.
    """

    __tablename__ = 'collections'
    collection_id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.user_id'))
    collection_datetime = Column(DateTime)
    name = Column(Text)
    description = Column(Text)
    tag = Column(Text)

    @classmethod
    def create_new_collection(cls, session, user_id, name,
            description='', collection_tag=''):
        with transaction.manager:
            collection = cls(
                user_id = user_id,
                collection_datetime = datetime.datetime.now(),
                name = name,
                description = description,
                tag = tag,
            )
        return collection

class CollectionPosts(Base):

    """
    Table to link posts to a collection.
    """

    __tablename__ = 'collectionposts'
    collection_post_id = Column(Integer, primary_key=True)
    collection_id = Column(Integer, ForeignKey('collections.collection_id'))
    post_id = Column(Integer, ForeignKey('posts.post_id'))

    @classmethod
    def create_new_collectionpost(cls, session, collection_id, post_id):
        with transaction.manager:
            collection_post = cls(
                collection_id = collection_id,
                post_id = post_id,
            )
        return collection_post

class Messages(Base):

    """
    Messages holds the messages to users from moderators and/or subscribers, as
    well as the users response messages.
    """

    __tablename__ = 'messages'
    message_id = Column(Integer, primary_key=True)
    userid = Column(Integer, ForeignKey('users.user_id'))
    message_datetime = Column(DateTime)
    parent_message_id = Column(Integer, ForeignKey('messages.message_id'))
    subject = Column(Text)
    text = Column(Text)
    was_read = Column(Text)

    @classmethod
    def create_message(cls, session, user_id, subject, text):
        with transaction.manager:
            message = cls(
                user_id = user_id,
                message_datetime = datetime.datetime.now(),
                parent_message_id = None,
                subject = subject,
                text = text,
                was_read = False,
            )

    @classmethod
    def create_response_message(cls, session, clientid, 
            parent_message_id, text, subject):
        with transaction.manager:
            user,created = Users.get_from_uniqueid(session,client_id)
            message = cls(
                userid = user.user_id,
                message_datetime = datetime.datetime.now(),
                parent_message_id = parent_message_id,
                subject = subject,
                text = text,
                was_read = False,
            )
        return message

    @classmethod
    def mark_as_read(cls, session, message_id):
        with transaction.manager:
            session.update().where(
                Messages.message_id == message_id
            ).values(
                was_read = True
            )
            transaction.commit()
        return True
