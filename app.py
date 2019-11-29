import os
import ltsp

import sqlalchemy
from sqlalchemy.ext.automap import automap_base
from sqlalchemy.orm import Session
from sqlalchemy import create_engine, inspect,func

from flask import Flask, render_template, request, jsonify
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)

ENV = 'dev'
# ENV = 'prod'

if ENV == 'dev':
    app.debug = True
    dbname = 'ltsp'
    app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://postgres:postgres@localhost:5432/' + dbname
else:
    app.debug = False
    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', '')
    # app.config['SQLALCHEMY_DATABASE_URI'] = 'postgres://mgginaipoimmvg:30d5b262fad6c9d3d6e3d182f719b8683d7acb35cbdaf8559696ef6a4631990c@ec2-107-22-239-155.compute-1.amazonaws.com:5432/ddus1nor2og7a5'

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)
engine = db.engine
session = db.session
inspector = inspect(engine)

Base = automap_base()
Base.prepare(engine, reflect=True)
# print(Base.classes.keys()) #  ==> ['descriptions', 'stocks']

try:
    Descriptions = Base.classes.descriptions
    Stocks = Base.classes.stocks
    tickers = ltsp.getTickers(engine)
    descriptions = ltsp.getDescriptions(engine)
except:
    class Descriptions(db.Model):
        __tablename__ = 'descriptions'
        ticker = db.Column(db.String(), primary_key=True)
        exchange = db.Column(db.String())
        cname = db.Column(db.String())
        sector = db.Column(db.String())
        industry = db.Column(db.String())

        def __init__(self, ticker,exchange,cname,sector,industry):
            self.ticker = ticker
            self.exchange = exchange
            self.cname = cname
            self.sector = sector
            self.industry = industry

    class Stocks(db.Model):
        __tablename__ = 'stocks'
        ticker = db.Column(db.String(), primary_key=True)
        openv = db.Column(db.Float)
        closev = db.Column(db.Float)
        adj_close = db.Column(db.Float)
        low = db.Column(db.Float)
        high = db.Column(db.Float)
        volume = db.Column(db.Float)
        wdate = db.Column(db.String(10), primary_key=True)

        def __init__(self, ticker,openv,closev,adj_close,low,high,volume,wdate):
            self.ticker = ticker
            self.openv = openv
            self.closev = closev
            self.adj_close = adj_close
            self.low = low
            self.high = high
            self.volume = volume
            self.wdate = wdate

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/cleantickersindescriptions')
def cleantickersindescriptions():
    info = ltsp.cleanTickersInDescriptions(engine,tickers,descriptions)
    return render_template('showinfo.html',message = info)

@app.route('/tickers')
def fillTickers():
    return jsonify(tickers)

@app.route('/infotypes')
def fillInfotypes():
    return jsonify(["Tables","tickers","exchange","sector","industry"])
    # return jsonify(["Tables","Descriptions","sector","exchange","industry"])

@app.route('/showinfo/<infotype>')
def showinfo(infotype):
    info = ""
    if infotype == "Tables":
        info = ltsp.infoTables(inspector)
    elif infotype == "tickers":
        info = ltsp.infoArray(infotype,tickers)
    # elif infotype == "Descriptions":
    #     info = ltsp.infoDescriptionsHead(descriptions)
    else:
        info = ltsp.infoArray(infotype,ltsp.getInfo(descriptions,infotype))

    return jsonify([info])
    # return jsonify([{infotype:info}])

if __name__ == '__main__':
    # app.debug = True
    app.run()
