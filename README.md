# Long-term Stock Predictor

1. [Selection of Datasets](#selection-of-datasets)
2. [Loading into PostgresSQL](#loading-into-postgressql)

***

## Selection of Datasets

Source: [Daily Historical Stock Prices (1970 - 2018)](https://www.kaggle.com/ehallmar/daily-historical-stock-prices-1970-2018)

[Back to top](#long-term-stock-predictor)

***

## Loading into PostgresSQL

```text
CREATE TABLE descriptions (
	ticker varchar PRIMARY KEY NOT NULL,
	exchange varchar NOT NULL,
	cname varchar NOT NULL,
	sector varchar NOT NULL,
	industry varchar NOT NULL
);

CREATE TABLE stocks (
	ticker varchar NOT NULL,
	openv float NOT NULL,
	closev float NOT NULL,
	adj_close float NOT NULL,
	low float NOT NULL,
	high float NOT NULL,
	volume float NOT NULL,
	wdate varchar(10) NOT NULL,
	
	FOREIGN KEY (ticker) REFERENCES descriptions(ticker),
	PRIMARY KEY (ticker,wdate)
);
```

[Back to top](#long-term-stock-predictor)

***

### Copyright

Daewon Kwon © 2019. All Rights Reserved.