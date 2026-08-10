# Backend Scripts

## init_db.py
Creates database tables from SQLAlchemy models and seeds default roles.

```bash
cd backend
python scripts/init_db.py
```

## create_test_roles.py
Creates the standard role list used for testing only.

```bash
cd backend
python scripts/create_test_roles.py
```

## create_user.py
Creates a new user for any existing role, including Viewer.

```bash
cd backend
python scripts/create_user.py --username viewer --email viewer@example.com --password Viewer123! --role Viewer
```

You can also create a user for a different role:

```bash
cd backend
python scripts/create_user.py --username sales1 --email sales1@example.com --password Sales123! --role Sales
```
You can also create a products :


```bash
cd backend
python 
```
