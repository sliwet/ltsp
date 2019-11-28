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
