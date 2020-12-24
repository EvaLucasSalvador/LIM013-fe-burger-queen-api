/* 
create database burguer_queen_2;

use burguer_queen_2;


#use mysql;
#update user set authentication_string=password(''), plugin='mysql_native_password' where user='root';
#ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'EVITA1415'
#flush privileges;


create table users (
	id int(8) not null auto_increment,
    email varchar(60),
    password varchar(10),
    admin varbinary(1),
    primary key(id)
);

describe users;

insert into users values
(2,'alex12313@gmail.com','12345',0);

select* from users; */