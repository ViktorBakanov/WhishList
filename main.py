from sqlalchemy import create_engine, Column, Integer, String, desc, asc, Boolean, Date, func
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from fastapi import FastAPI, status, Body, Request
from fastapi.responses import FileResponse, RedirectResponse, JSONResponse, HTMLResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from pathlib import Path
import datetime

#My Local database
#SQLALCHEMY_DATABASE_URL = 'postgresql://postgres:poqw0912@localhost:5432/WhishList'
#SQLALCHEMY_DATABASE_URL = 'mysql://a1059158:Hohner1857@141.8.192.138/a1059158_MyDataBase'
SQLALCHEMY_DATABASE_URL = 'sqlite:///./myDataBase.db'

engine = create_engine(SQLALCHEMY_DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class Base(DeclarativeBase): pass

#Initiate a data base table
class Data(Base):
    __tablename__ = "whish_list"
 
    id = Column(Integer, primary_key=True, index=True)
    present_name = Column(String)
    present_link = Column(String)
    present_link_photo = Column(String)
    giver_name = Column(String)
    is_reserved = Column(Boolean,default=False)
    birthday_person = Column(String)
    celebration_date = Column(String)

#Create table
Base.metadata.create_all(bind=engine)

#Create session to connect to a teble
SessionLocal = sessionmaker(autoflush=False, bind=engine)
db = SessionLocal()

app = FastAPI()

BASE_DIR = Path(__file__).resolve().parent
templates = Jinja2Templates(directory=str(Path(BASE_DIR, 'public')))
app.mount('/public', StaticFiles(directory='public', html=True), name='public')

#Loading whishList.html page
@app.get("/index")
async def main():
    return FileResponse("public/index.html")

#Get whishlist on birthdate
@app.get("/api/gregory/{birth_date}")
def get_gregory_by_date(birth_date):
    try:
        return db.query(Data).filter(Data.celebration_date == birth_date, Data.birthday_person == 'Gregory').all()
    except SQLAlchemyError as e:
        error = str(e)
        return error
    
#Edit present owner
@app.post("/api/reserve")
def reserve_present (data_body = Body()):
    db_present = db.query(Data).filter(Data.id == data_body["present_id"]).one()
    db_present.giver_name = data_body["giver"]
    db_present.is_reserved = True
    
    try:
        db.commit()
        db.refresh(db_present)
    except SQLAlchemyError as e:
        error = str(e)
        db.rollback()
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            content={ "message": error }
        )

#Create new wish from parents.html
@app.post("/api/create_wish")
def create_new_item(data_body = Body()):

    current_year = str(datetime.date.today().year)
    match data_body["birthday_person"]:
        case 'Gregory':
            celeb_date = current_year+'-12-25'
        case 'Mark':
            celeb_date = current_year+'-03-24'
        case 'Vika':
            celeb_date = current_year+'-03-30'
        case 'Vitya':
            celeb_date = current_year+'-12-03'

    item = Data()
    item.present_name = data_body["present_name"]
    item.present_link = data_body["present_link"]
    item.birthday_person = data_body["birthday_person"]
    item.present_link_photo = data_body["present_link_photo"]
    item.celebration_date = celeb_date
    item.giver_name = ''
    item.is_reserved = False

    try:
        db.add(item)
        db.commit()
    except SQLAlchemyError as e:
        error = str(e)
        db.rollback()
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            content={ "message": error }
        )

#Opening parents.html
@app.get("/parents", response_class=HTMLResponse)
async def parents_lk(request: Request):
    return FileResponse('public/parents.html')