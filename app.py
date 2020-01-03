import os
from modules import ltspquery

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
    # app.config['SQLALCHEMY_DATABASE_URI'] = "sqlite:///db/ltsp.sqlite"
    app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://postgres:postgres@localhost:5432/ltsp'
else:
    app.debug = False
    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', '')

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
    Nasdaq = Base.classes.nasdaq
    Snp500 = Base.classes.snp500
    tickers = ltspquery.getTickers(engine)
    descriptions = ltspquery.getDescriptions(engine)
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

    class Nasdaq(db.Model):
        __tablename__ = 'nasdaq'
        wdate = db.Column(db.String(10), primary_key=True)
        openv = db.Column(db.Float)
        high = db.Column(db.Float)
        low = db.Column(db.Float)
        closev = db.Column(db.Float)
        adj_close = db.Column(db.Float)
        volume = db.Column(db.Float)

        def __init__(self,wdate, openv,high,low,closev,adj_close,volume):
            self.wdate = wdate
            self.openv = openv
            self.high = high
            self.low = low
            self.closev = closev
            self.adj_close = adj_close
            self.volume = volume

    class Snp500(db.Model):
        __tablename__ = 'snp500'
        wdate = db.Column(db.String(10), primary_key=True)
        openv = db.Column(db.Float)
        high = db.Column(db.Float)
        low = db.Column(db.Float)
        closev = db.Column(db.Float)
        adj_close = db.Column(db.Float)
        volume = db.Column(db.Float)

        def __init__(self,wdate, openv,high,low,closev,adj_close,volume):
            self.wdate = wdate
            self.openv = openv
            self.high = high
            self.low = low
            self.closev = closev
            self.adj_close = adj_close
            self.volume = volume

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/cleantickersindescriptions')
def cleantickersindescriptions():
    info = ltspquery.cleanTickersInDescriptions(engine,tickers,descriptions)
    return render_template('showinfo.html',message = info)

@app.route('/getempty')
def getempty():
    return jsonify([])

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
        info = ltspquery.infoTables(inspector)
    elif infotype == "tickers":
        info = ltspquery.infoArray(infotype,tickers)
    # elif infotype == "Descriptions":
    #     info = ltspquery.infoDescriptionsHead(descriptions)
    else:
        info = ltspquery.infoArray(infotype,ltspquery.getInfo(descriptions,infotype))

    return jsonify([info])
    # return jsonify([{infotype:info}])

@app.route('/gettickerdata/<tickers_str>')
def gettickerdata(tickers_str):
    return jsonify(ltspquery.getTickerdata(engine,tickers_str))

if __name__ == '__main__':
    # app.debug = True
    app.run()
