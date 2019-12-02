import pandas as pd
import datetime as dt


def infoTable(inspector, tablename):
    message = f"---------------------------<br>{tablename}<br>---------------------------<br>"
    columns = inspector.get_columns(tablename)
    for column in columns:
        message = message + f"{column['name']}, {column['type']}<br>"
    return message


def infoTables(inspector):
    tablenames = inspector.get_table_names()
    message = ""
    for table in tablenames:
        message = message + infoTable(inspector, table)
    return message


def getTickers(connection):
    tickers_stocks = pd.read_sql_query('SELECT ticker FROM stocks GROUP BY ticker', connection)
    return tickers_stocks['ticker'].tolist()


def infoArray(arrdesc, arrname):
    message = f"===================<br>Number of {arrdesc}: {len(arrname)}<br>===================<br>"
    for oneitem in arrname:
        message = message + oneitem + "<br>"
    return message


def getDescriptions(connection):
    return pd.read_sql_query('SELECT * FROM descriptions', connection)


def infoDescriptionsHead(descriptions):
    return descriptions.head().to_string().replace('\n', "<br>")


def getInfo(descriptions, infotype):
    return descriptions[infotype].unique()


def cleanTickersInDescriptions(connection, tickers, descriptions):
    tickers_desc = descriptions['ticker'].unique()
    count = 0
    notpresent = 0
    for ticker in tickers_desc:
        if ticker in tickers:
            count = count + 1
        else:
            notpresent = notpresent + 1
            query = f"DELETE FROM descriptions WHERE ticker = '{ticker}';"
            connection.execute(query)
    message = f"Number of deleted tickers: {notpresent}<br>Number of matching tickers: {count}"
    return message
    #         connection.execute('SELECT * FROM train LIMIT 5').fetchall()
    #         connection.execute("DELETE FROM train WHERE wdate = '2010-03-12'")

def getTickerdata(connection, tickers_str):
    tickers = tickers_str.split('_')
    data = []
    for ticker in tickers:
        oneticker = pd.read_sql_query(f"SELECT * FROM stocks WHERE ticker = '{ticker}'", connection)
        # xdata = [dt.datetime.strptime(d, '%Y-%m-%d').date() for d in oneticker['wdate']]
        xdata = oneticker['wdate'].tolist()
        ydata = oneticker['closev'].tolist()
        data.append({"x":xdata,"y":ydata})
        
    return data
