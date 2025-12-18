CREATE TABLE Product (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  name VARCHAR(60),
  price REAL,
  stock INTEGER
);

insert into Product(name,price,stock) values ("Onion",10,2);
insert into Product(name,price,stock) values ("Potato",10,30);

Select * from Product;

update product set stock = 50 where price = 10;

delect from product where name = "Onion";

-- Task 1: Create table for storing your profile data in a table with attributes - Student name, Learning minutes, Attendence and Designation.
-- Task 2: Insert data for student named Sancheeta. Her learning minutes are 120 mins, attendance is 4 lectures, designation is Software Engineer.
-- Task 3: Update table to change her attendance to 5.

Create table Profile (
  student_name VARCHAR(50),
  learning_minutes INTEGER,
  attendance INTEGER,
  designation VARCHAR(50)
);

Insert into Profile(student_name, learning_minutes, attendance, designation) values ("Sadik", 120, 4, "Software Engineer");
Select * from Profile;
Update Profile set attendance = 5 where student_name = "Sadik";
Select * from Profile;

Alter table Profile add column id INTEGER AUTOINCREMENT NOT NULL default 1;