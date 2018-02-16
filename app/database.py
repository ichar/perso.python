﻿# -*- coding: utf-8 -*-

import re
from sqlalchemy import create_engine
from copy import deepcopy
import pymssql

from config import (
     CONNECTION, IsDebug, IsDeepDebug,
     default_unicode, default_encoding, default_iso,
     print_to, print_exception
     )

from .utils import splitter, worder, getMaskedPAN

default_connection = CONNECTION['bankperso']

database_config = { \
    # =========
    # BANKPERSO
    # =========
    'orders' : { \
        'columns' : ('FileID', 'FName', 'FQty', 'BankName', 'FileType', 'StatusDate', 'FileStatus', 'RegisterDate', 'ReadyDate',),
        'view'    : '[BankDB].[dbo].[WEB_OrdersStatus_vw]',
        'headers' : { \
            'FileID'       : ('ID файла',                   '',),
            'FName'        : ('ФАЙЛ',                       'nowrap',),
            'FQty'         : ('Кол-во',                     '',),
            'BankName'     : ('КЛИЕНТ',                     '',),
            'FileType'     : ('Тип файла',                  '',),
            'StatusDate'   : ('Дата статуса',               '',),
            'FileStatus'   : ('СТАТУС',                     'breakable',),
            'RegisterDate' : ('Дата регистрации',           '',),
            'ReadyDate'    : ('Ожидаемая дата готовности',  '',),
        },
        'clients' : 'ClientID',
        'export'  : ('FileID', 'FileTypeID', 'ClientID', 'FileStatusID', 'FName', 'FQty', 'BankName', 'FileType', 'StatusDate', 'FileStatus', 'RegisterDate', 'ReadyDate',),
    },
    'batches' : { \
        'columns' : ('TZ', 'TID', 'BatchType', 'BatchNo', 'ElementQty', 'Status', 'StatusDate',),
        'view'    : '[BankDB].[dbo].[WEB_OrdersBatchList_vw]',
        'headers' : { \
            'TZ'           : 'ТЗ',
            'TID'          : 'ID партии',
            'BatchType'    : 'Тип',
            'BatchNo'      : '№ партии',
            'ElementQty'   : 'Кол-во',
            'Status'       : 'Статус партии',
            'StatusDate'   : 'Дата статуса',
        },
        'export'  : ('TZ', 'TID', 'BatchType', 'BatchNo', 'ElementQty', 'Status', 'StatusDate', 'FileID', 'FileStatusID', 'BatchStatusID', 'BatchTypeID',) #  'ERP_TZ', 'ClientID', 'FileTypeID', 'FileStatusID', 'FName', 'FQty', 'RegisterDate', 'BankName'
    },
    'batches.preview' : { \
        'columns' : ('TID',),
        'view'    : '[BankDB].[dbo].[WEB_OrdersBatchPreview_vw]',
        'export'  : ('TID', 'IsPrintMaterialOrder', 'BatchStatusID', 'FileStatusID', 'RegisterDate',),
    },
    'logs' : { \
        'columns' : ('LID', 'ModDate', 'FileStatusID', 'Status', 'Oper', 'HostName', 'ApplName', 'UserName',), # 'LID', 'TID',
        'view'    : '[BankDB].[dbo].[WEB_OrdersLog_vw]',
        'headers' : { \
            'LID'          : 'ID',
            'TID'          : 'ID файла',
            'ModDate'      : 'Дата статуса',
            'FileStatusID' : 'Код статуса',
            'Status'       : 'Наименование статуса',
            'Oper'         : 'Код операции',
            'HostName'     : 'Хост',
            'ApplName'     : 'Приложение',
            'UserName'     : 'Оператор',
        },
    },
    'banks' : { \
        'columns' : ('ClientID', 'BankName',),
        'view'    : '[BankDB].[dbo].[WEB_OrdersStatus_vw]',
        'headers' : { \
            'BankName'     : 'Клиент',
        },
        'clients' : 'ClientID',
    },
    'clients' : { \
        'columns' : ('TID', 'CName'),
        'view'    : '[BankDB].[dbo].[DIC_Clients_tb]',
        'headers' : { \
            'TID'          : 'ID',
            'CName'        : 'Наименование',
        },
        'clients' : 'TID',
    },
    'types' : { \
        'columns' : ('TID', 'CName', 'ClientID',),
        'view'    : '[BankDB].[dbo].[DIC_FileType_tb]',
        'headers' : { \
            'TID'          : 'ID',
            'ClientID'     : 'ID клиента',
            'CName'        : 'Тип файла',
        },
        'clients' : 'ClientID',
    },
    'statuses' : { \
        'columns' : ('TID', 'CName',),
        'view'    : '[BankDB].[dbo].[DIC_FileStatus_tb]',
        'headers' : { \
            'TID'          : 'ID',
            'Status'       : 'Статус файла',
        },
    },
    'filestatuses' : { \
        'columns' : ('FileID', 'FileStatusID',),
        'view'    : '[BankDB].[dbo].[OrderFilesBody_tb]',
        'headers' : { \
            'Status'       : 'Статус файла',
        },
    },
    'filestatuslist' : { \
        'columns' : ('TID', 'StatusTypeID', 'CName',),
        'view'    : '[BankDB].[dbo].[DIC_FileStatus_tb]',
        'headers' : { \
            'TID'          : 'ID',
            'StatusTypeID' : 'Тип cтатуса',
            'CName'        : 'Наименование',
        },
    },
    'batchstatuslist' : { \
        'columns' : ('TID', 'CName',),
        'view'    : '[BankDB].[dbo].[DIC_BatchStatus_tb]',
        'headers' : { \
            'TID'          : 'ID',
            'CName'        : 'Наименование',
        },
    },
    'batchtypelist' : { \
        'columns' : ('TID', 'CName',),
        'view'    : '[BankDB].[dbo].[DIC_BatchType_tb]',
        'headers' : { \
            'TID'          : 'ID',
            'CName'        : 'Наименование',
        },
    },
    'params' : { \
        'columns' : ('TID', 'PName', 'PValue', 'PSortIndex', 'TName', 'TValue', 'FTVLinkID', 'TagParamID', 'FileTypeID', 'FileID', 'BatchID', 'PERS_TZ', 'BatchTypeID', 'ElementQty',),
        'exec'    : '[BankDB].[dbo].[WEB_GetBatchParamValues_sp]',
        'headers' : { \
            'TID'          : 'ID параметра',
            'PName'        : 'Название параметра',
            'PValue'       : 'Значение',
            'PSortIndex'   : 'Индекс сортировки',
            'TName'        : 'Параметр конфигурации',
            'TValue'       : 'Код значения',
            'FTVLinkID'    : 'ID значения тега',
            'TagParamID'   : 'ID параметра',
            'FileTypeID'   : 'ID типа файла',
            'FileID'       : 'ID файла',
            'BatchID'      : 'ID партии',
            'PERS_TZ'      : 'Номер ТЗ',
            'BatchTypeID'  : 'ID типа партии',
            'ElementQty'   : 'Количество элементов в партии',
        },
    },
    'image': { \
        'columns' : ('FileID', 'FBody',),
        'exec'    : '[BankDB].[dbo].[WEB_GetOrderFileBodyImage_sp]',
        'headers' : { \
            'FileID'       : 'ID файла',
            'FBody'        : 'Контент заказа',
        },
    },
    'body': { \
        'columns' : ('FileID', 'FileStatusID', 'IBody',),
        'exec'    : '[BankDB].[dbo].[WEB_GetOrderFileBody_sp]',
        'headers' : { \
            'FileID'       : 'ID файла',
            'FileStatusID' : 'ID статуса файла',
            'IBody'        : 'Контент заказа',
        },
    },
    'TZ' : { \
        'columns' : ('PName', 'PValue', 'PSortIndex', 'PType', 'ElementQty',),
        'exec'    : '[BankDB].[dbo].[WEB_GetBatchParamValues_sp]',
        'headers' : { \
            'PName'        : 'Название параметра',
            'PValue'       : 'Значение',
            'ElementQty'   : 'Количество элементов в партии',
            'PSortIndex'   : 'Индекс сортировки',
            'PType'        : 'Тип параметра',
        },
        'exclude' : ('CLIENTID', 'DeliveryType', 'PackageCode',),
        'rename'  : { \
            'PlasticType'  : ('', 25),
        },
    },
    'materials.order' : { \
        'columns' : ('BatchType', 'ERP_TZ', 'MName', 'BatchQty', 'Qty',),
        'params'  : "%(file_id)s,%(show)s",
        'exec'    : '[BankDB].[dbo].[WEB_MaterialForFile_sp]',
        'headers' : { \
            'BatchType'    : 'Тип партии',
            'ERP_TZ'       : 'ЕРП ТЗ',
            'MName'        : 'Наименование материала',
            'BatchQty'     : 'Количество элементов в партии',
            'Qty'          : 'Зарезервировать на складе',
        },
    },
    'materials.approval' : { \
        'params'  : "%(file_id)s,'%(file_status_ids)s',0",
        'exec'    : '[BankDB].[dbo].[WEB_ApprovalMaterialOrder_sp]',
    },
    'materials.check' : { \
        'params'  : "%(file_id)s,'%(file_status_ids)s',%(check)s",
        'exec'    : '[BankDB].[dbo].[WEB_ApprovalMaterialOrder_sp]',
    },
    'persolog': { \
        'columns' : ('Date', 'Code', 'Message',),
        'headers' : { \
            'Date'         : 'Дата Время',
            'Code'         : 'Результат',
            'Message'      : 'Текст сообщения',
        },
        'export'  : ('Date', 'Code', 'Message',),
    },
    'infoexchangelog': { \
        'columns' : ('Date', 'Code', 'Message',),
        'headers' : { \
            'Date'         : 'Дата Время',
            'Time'         : 'Время',
            'Code'         : 'Результат',
            'Message'      : 'Текст сообщения',
        },
        'export' : ('Date', 'Code', 'Message',), # , 'Time'
    },
    'sdclog': { \
        'columns' : ('Date', 'Code', 'Message',),
        'headers' : { \
            'Date'         : 'Дата Время',
            'Time'         : 'Время',
            'Code'         : 'Результат',
            'Message'      : 'Текст сообщения',
        },
        'export'  : ('Date', 'Time', 'Code', 'Message',),
    },
    'exchangelog': { \
        'columns' : ('Date', 'Module', 'Code', 'Message',),
        'headers' : { \
            'Date'         : 'Дата Время',
            'Time'         : 'Время',
            'Module'       : 'Модуль',
            'Code'         : 'Результат',
            'Message'      : 'Текст сообщения',
        },
        'export'  : ('Date', 'Time', 'Module', 'Code', 'Message',),
    },
    'bankperso.semaphore': { \
        'columns' : ('LID', 'Status', 'Oper',),
        'params'  : "%(mode)s,%(oid)s,%(bid)s,null,''",
        'exec'    : '[BankDB].[dbo].[WEB_SemaphoreEvents_sp]',
    },
    # --------------------------------
    # Представления на контенте заказа
    # --------------------------------
    'cardholders' : { \
        'root'    : 'FileBody_Record',
        'tags'    : ( \
            ('FileRecNo',),
            ('PAN', 'PANWIDE',),
            ('EMBNAME1', 'FIO', 'ClientName', 'CardholderName', 'EMBNAME', ('FIRSTNAME', 'SECONDNAME', 'LASTNAME'), 
                ('LSTN', 'FRSN'), ('FirstName', 'SurName', 'SecondName'), 'EmbName', 'TRACK1NAME',),
            ('ExpireDate', 'EDATE', 'EDATE_YYMM', 'EXPDATE', 'EDATE_YYYYMM',),
            ('PLASTIC_CODE', 'PlasticType', 'PLASTIC_TYPE', 'PlasticID',),
            ('CardType', 'CLIENT_ID', 'CHIP_ID',),
            ('KIND',),
            ('FactAddress', 'BRANCH_NAME', 'DEST_NAME',)
        ),
        'columns' : ('FileRecNo', 'PAN', 'Cardholder', 'ExpireDate', 'PLASTIC_CODE', 'CardType', 'KIND', 'FactAddress',),
        'headers' : { \
            'FileRecNo'    : '#',
            'PAN'          : 'PAN',
            'Cardholder'   : 'ФИО клиента',
            'ExpireDate'   : 'Дата истечения',
            'PLASTIC_CODE' : 'Код пластика',
            'CardType'     : 'Тип карты',
            'KIND'         : 'Вид',
            'FactAddress'  : 'Фактический адрес',
        },
        'func'    : {'PAN' : getMaskedPAN },
    },
    # ---------------
    # Операции BankDB
    # ---------------
    'activate' : { \
        'params'  : '%(batch_id)s',
        'exec'    : '[BankDB].[dbo].[WEB_BatchActivate_sp]',
    },
    'changefilestatus' : { \
        'params'  : "null,null,0,%(file_id)s,%(check_file_status)s,%(new_file_status)s,null,null,null,1,0,0,0",
        'exec'    : '[BankDB].[dbo].[WEB_ChangeOrderState_sp]',
    },
    'changebatchstatus' : { \
        'params'  : "null,null,0,%(file_id)s,null,null,%(batch_id)s,null,%(new_batch_status)s,0,1,0,0",
        'exec'    : '[BankDB].[dbo].[WEB_ChangeOrderState_sp]',
    },
    'deletefile' : { \
        'params'  : "null,null,0,%(file_id)s,null,0,null,null,0,1,1,1,1",
        'exec'    : '[BankDB].[dbo].[WEB_ChangeOrderState_sp]',
    },
    'createfile'  : { \
        'params'  : "null,null,0,%(file_id)s,1,1,null,null,0,1,1,1,0",
        'exec'    : '[BankDB].[dbo].[WEB_ChangeOrderState_sp]',
    },
    'dostowin' : { \
        'params'  : "0,'%s'",
        'exec'    : '[BankDB].[dbo].[WEB_DecodeCyrillic_sp]',
    },
    'wintodos' : { \
        'params'  : "1,'%s'",
        'exec'    : '[BankDB].[dbo].[WEB_DecodeCyrillic_sp]',
    },
    # ==================
    # CARDS PERSOSTATION
    # ==================
    'cards.batches' : { \
        'columns' : ('TID', 'Client', 'FName', 'TZ', 'BQty', 'PQty', 'PersType', 'PersStatus', 'Status',), # 'StatusDate', 'BatchID'
        'view'    : '[Cards].[dbo].[WEB_Batches_vw]',
        'headers' : { \
            'TID'          : ('ID партии',       '',),
            'BatchID'      : ('ID ТЗ',           '',),
            'Client'       : ('КЛИЕНТ',          '',),
            'FName'        : ('ФАЙЛ ЗАКАЗА',     'breakable',),
            'TZ'           : ('№ ТЗ',            '',),
            'BQty'         : ('Кол-во в ТЗ',     '',),
            'PQty'         : ('Кол-во в партии', '',),
            'PersType'     : ('Тип партии',      '',),
            'Status'       : ('Статус ТЗ',       'nowrap',),
            'PersStatus'   : ('Статус партии',   'nowrap',),
            'StatusDate'   : ('Дата статуса',    '',),
        },
        'export'  : ('TID', 'BatchID', 'Client', 'FName', 'TZ', 'BQty', 'PQty', 'PersType', 'Status', 'PersStatus', 'StatusDate', 'StatusID', 'PersTypeID',),
    },
    'cards.batches-log' : { \
        'columns' : ('LID', 'Status', 'StatusID', 'StatusDate', 'Oper', 'HostName', 'ApplName', 'UserName', 'ModDate'),
        'view'    : '[Cards].[dbo].[WEB_BatchesLog_vw]',
        'headers' : { \
            'LID'          : 'ID',
            'BatchID'      : 'ID ТЗ',
            'FName'        : 'ФАЙЛ ЗАКАЗА',
            'TZ'           : '№ ТЗ',
            'FQty'         : 'Кол-во',
            'Status'       : 'Наименование статуса',
            'StatusID'     : 'Код статуса',
            'StatusDate'   : 'Дата статуса',
            'Oper'         : 'Код операции',
            'HostName'     : 'Хост',
            'ApplName'     : 'Приложение',
            'UserName'     : 'Оператор',
            'ModDate'      : 'Дата изменения',
        },
        'export'  : ('LID', 'BatchID', 'TZ', 'Client', 'FName', 'FQty', 'Status', 'StatusID', 'StatusDate', 'Oper', 'HostName', 'ApplName', 'UserName', 'ModDate'),
    },
    'cards.batch-opers' : { \
        'columns' : ('TID', 'CName', 'Status', 'StatusDate',),
        'view'    : '[Cards].[dbo].[WEB_BatchOpers_vw]',
        'headers' : { \
            'TID'          : 'ID операции',
            'CName'        : 'Тип операции',
            'Status'       : 'Статус операции',
            'StatusDate'   : 'Дата статуса',
        },
        'export'  : ('TID', 'CName', 'Status', 'StatusDate', 'BatchID', 'StatusID', 'PersOperTypeID',),
    },
    'cards.batch-opers-log' : { \
        'columns' : ('LID', 'PersOperType', 'Status', 'StatusID', 'StatusDate', 'Oper', 'HostName', 'ApplName', 'UserName', 'ModDate'),
        'view'    : '[Cards].[dbo].[WEB_PersBatchOpersLog_vw]',
        'headers' : { \
            'LID'          : 'ID',
            'BatchOperID'  : 'ID операции',
            'PersBatchID'  : 'ID партии',
            'PersOperType' : 'Операция',
            'Status'       : 'Наименование статуса',
            'StatusID'     : 'Код статуса',
            'StatusDate'   : 'Дата статуса',
            'Oper'         : 'Код операции',
            'HostName'     : 'Хост',
            'ApplName'     : 'Приложение',
            'UserName'     : 'Оператор',
            'ModDate'      : 'Дата изменения',
        },
        'export'  : ('LID', 'BatchOperID', 'PersBatchID', 'Status', 'StatusID', 'StatusDate', 'PersOperTypeID', 'PersOperType', 'Oper', 'HostName', 'ApplName', 'UserName', 'ModDate'),
    },
    'cards.batch-params' : { \
        'columns' : ('TID', 'PType', 'PName', 'PValue',),
        'view'    : '[Cards].[dbo].[WEB_BatchParams_vw]',
        'headers' : { \
            'TID'          : 'ID параметра',
            'PType'        : 'Тип параметра',
            'PName'        : 'Наименование параметра',
            'PValue'       : 'Значение',
        },
        'export'  : ('TID', 'BatchID', 'TZ', 'PType', 'PName', 'PValue',),
    },
    'cards.pers-batch-opers' : { \
        'columns' : ('TID', 'Oper', 'Status', 'StatusDate',),
        'view'    : '[Cards].[dbo].[WEB_PersBatchOpers_vw]',
        'headers' : { \
            'TID'          : 'ID операции',
            'Oper'         : 'Тип операции',
            'Status'       : 'Статус операции',
            'StatusDate'   : 'Дата статуса',
        },
        'export'  : ('TID', 'Oper', 'Status', 'StatusDate', 'PersBatchID', 'PersOperTypeID', 'PersBatchOperStatusID',),
    },
    'cards.batch-oper-params' : { \
        'columns' : ('TID', 'PName', 'PValue',),
        'view'    : '[Cards].[dbo].[WEB_BatchOperParams_vw]',
        'headers' : { \
            'TID'          : 'ID параметра',
            'PName'        : 'Наименование параметра',
            'PValue'       : 'Значение',
        },
        'export'  : ('TID', 'PName', 'PValue', 'BatchID', 'PersBatchID', 'BatchOperID', 'BatchOperTypeID',),
    },
    'cards.batch-units' : { \
        'columns' : ('TID', 'FileRecNo', 'PAN', 'Status', 'StatusDate',), #, 'BatchStatus'
        'view'    : '[Cards].[dbo].[WEB_BatchUnits_vw]',
        'headers' : { \
            'TID'          : 'ID карты',
            'FileRecNo'    : 'Номер записи',
            'PAN'          : 'PAN',
            'Status'       : 'Наименование статуса',
            'BatchStatus'  : 'Статус партии',
            'StatusDate'   : 'Дата статуса',
        },
        'export'  : ('TID', 'FileRecNo', 'PAN', 'Status', 'BatchStatus', 'StatusDate', 'BatchID', 'StatusID'),
    },
    'cards.clients' : { \
        'columns' : ('Client',),
        'view'    : '[Cards].[dbo].[WEB_Clients_vw]',
    },
    'cards.files' : { \
        'columns' : ('Client', 'FileName',),
        'view'    : '[Cards].[dbo].[WEB_Files_vw]',
    },
    'cards.perstypes' : { \
        'columns' : ('TID', 'CName',),
        'view'    : '[Cards].[dbo].[WEB_PersTypes_vw]',
    },
    'cards.statuses' : { \
        'columns' : ('TID', 'CName',),
        'view'    : '[Cards].[dbo].[WEB_Statuses_vw]',
    },
    'cards.persstatuses' : { \
        'columns' : ('CName',),
        'view'    : '[Cards].[dbo].[WEB_GetPersBatchStatuses_fn]()',
    },
    'cards.semaphore': { \
        'columns' : ('LID', 'Status', 'Oper',),
        'params'  : "%(mode)s,%(oid)s,%(bid)s,null,''",
        'exec'    : '[Cards].[dbo].[WEB_SemaphoreEvents_sp]',
    },
    # --------------
    # Операции Cards
    # --------------
    'cards.activate' : { \
        'params'  : "%(pers_id)s",
        'exec'    : '[Cards].[dbo].[WEB_PersBatch_Activate_sp]',
    },
    'cards.reject' : { \
        'params'  : "%(pers_id)s",
        'exec'    : '[Cards].[dbo].[WEB_PersBatch_Reject_sp]',
    },
    # -------------------------------
    # Параметры партий персонализации
    # -------------------------------
    'cards.plastic-params' : { \
        'exec'    : '[Cards].[dbo].[WEB_BatchFreeParams_For_PlasticOrder_sp]',
        'params'  : "'%(pers_ids)s'",
        'fields'  : { \
            'BatchID'      : (0,  'BatchID',       'ID партии',               0, None),
            'ClientIDStr'  : (1,  'ClientIDStr',   'Идентификатор клиента',   0, ''),
            'BQty'         : (2,  'Qty',           'Кол-во (в партии/ТЗ)',    0, 0),
            'PersBatchType': (3,  'PersBatchType', 'Тип партии',              1, None),
            'PersBatchID'  : (4,  'PersBatchID',   'ID ТЗ',                   0, None),
            'SysBatchID'   : (5,  'SysBatchID',    '№ ТЗ',                    0, None),
            'CardsName'    : (6,  'Column1',       'Наименование карт',       1, ''),
            'CardsType'    : (7,  'Column2',       'Вид карт',                1, ''),
            'PlasticType'  : (8,  'Column3',       'Тип карт',                1, ''),
            'ERP_TZ'       : (10, 'Column4',       'ERP ТЗ',                  0, None),
            'BlankPaper'   : (11, 'Column10',      'Бланк листовки',          1, ''),
            'Urgency'      : (12, 'Column5',       'Срочность:[СРОЧНО 6ч.!]', 1, ''),
            'FileName'     : (13, 'Column6',       'Имя файла',               0, ''),
            'ReadyDate'    : (14, 'Column7',       'Ожидаемая дата отгрузки', 0, ''),
            'ClientName'   : (15, 'Column8',       'Имя клиента',             1, ''),
            'FQty'         : (16, 'Column9',       'Кол-во (в файле)',        0, 0),
            'SumQty'       : (17, 'Column11',      'Сумма',                   0, 0),
        },
        'TZ' : { \
            'Column1'      : 'Клиент',
            'Column2'      : 'Тип карт',
            'Column3'      : 'Тип пластика',
            'Column4'      : 'ERP ТЗ',
        },
    },
    'cards.plastic-params-new' : { \
        'exec'    : '[Cards].[dbo].[WEB_BatchFreeParams_For_PlasticOrderNew_sp]',
        'params'  : "'%(pers_ids)s'",
        'fields'  : { \
            'Qty'          : (0, 'Qty',     'Кол-во',                         0, 0),
            'CardsName'    : (1, 'Column1', 'Наименование карт',              1, ''),
            'CardsType'    : (2, 'Column2', 'Вид карт',                       0, ''),
            'PlasticType'  : (3, 'Column3', 'Тип карт',                       1, ''),
            'ERP_TZ'       : (4, 'Column4', 'ERP_TZ',                         0, None),
            'BatchesInfo'  : (5, 'Column5', '[(№ ТЗ/партии, кол-во XXX)...]', 1, ''),
            'FileName'     : (6, 'Column6', 'Имя файла',                      0, ''),
            'ReadyDate'    : (7, 'Column7', 'Ожидаемая дата отгрузки',        0, ''),
            'ClientName'   : (8, 'Column8', 'Имя клиента',                    1, ''),
        },
        'TZ' : { \
            'Column1'      : 'Клиент',
            'Column2'      : 'Тип карт',
            'Column3'      : 'Тип пластика',
            'Column4'      : 'ERP ТЗ',
        },
    },
    'cards.plastic-params-info' : { \
        'exec'    : '[Cards].[dbo].[W_GetClientIDStr_fn]',
        'params'  : "%(pers_id)s",
        'fields'  : { \
            'ClientIDStr'  : (0, 'ClientIDStr',         'Идентификатор клиента',   0, ''),
            'SysBatchID'   : (1, 'SysBatchID',          '№ ТЗ',                    0, None),
            'BQty'         : (2, 'BatchElementQty',     'Кол-во (в ТЗ)',           0, 0),
            'PQty'         : (3, 'PersBatchElementQty', 'Кол-во (в партии)',       0, 0),
            'PersBatchType': (4, 'PersBatchType',       'Тип партии',              1, None),
            'FileName'     : (5, 'OrderFName',          'Имя файла',               0, ''),
        },
    },
    # ==================
    # PRELOADER HANDLERS
    # ==================
    'preloads' : { \
        'columns' : ('PreloadID', 'FName', 'FQty', 'BankName', 'StartedDate', 'FinishedDate', 'ErrorCode', 'OrderNum', 'FinalMessage', 'RegisterDate',),
        'view'    : '[BankDB].[dbo].[WEB_OrdersPreload_vw]',
        'headers' : { \
            'PreloadID'    : ('ID загрузки',                    '',),
            'FName'        : ('ФАЙЛ',                           '',),
            'FQty'         : ('Кол-во',                         '',),
            'BankName'     : ('КЛИЕНТ',                         '',),
            'StartedDate'  : ('Дата старта',                    '',),
            'FinishedDate' : ('Дата завершения',                '',),
            'ErrorCode'    : ('Код ошибки',                     '',),
            'OrderNum'     : ('НОМЕР ЗАКАЗА ПРОИЗВОДСТВА (1С)', '',),
            'FinalMessage' : ('Сообщение обработчика',          '',),
            'RegisterDate' : ('Дата регистрации',               '',),
        },
        'clients' : 'ClientID',
        'export'  : ('PreloadID', 'FName', 'FQty', 'BankName', 'StartedDate', 'FinishedDate', 'ErrorCode', 'OrderNum', 'RegisterDate',),
    },
    'articles' : { \
        'columns' : ('[#]', 'Article', 'BIN', 'V', 'Q', 'unavailable',),
        'view'    : '[BankDB].[dbo].[WEB_OrdersPreloadArticleList_vw]',
        'headers' : { \
            '[#]'          : '№',
            'Article'      : 'Артикул',
            'BIN'          : 'БИН',
            'V'            : 'Вид',
            'Q'            : 'Резерв',
            'unavailable'  : 'Наличие на складе',
        },
    },
    # =======================================
    # BANKPERSO ORDER STATE MANAGEMENT SYSTEM
    # =======================================
    'orderstate-orders' : { \
        'columns' : ('TID', 'Client', 'BP_FileID', 'PackageName', 'Qty', 'Host', 'BaseFolder', 'ArchiveFolder', 'RD',),
        'view'    : '[OrderState].[dbo].[SHOW_Orders_vw]',
        'headers' : { \
            'TID'          : ('ID заказа',              '',),
            'ClientID'     : ('ID клиента',             '',),
            'Client'       : ('КЛИЕНТ',                 '',),
            'Aliases'      : ('Алиасы клиента',         '',),
            'BP_FileID'    : ('ID файла BP',            '',),
            'PackageName'  : ('ИДЕНТИФИКАТОР ПАКЕТА',   '',),
            'Qty'          : ('Кол-во',                 '',),
            'Host'         : ('ХОСТ',                   '',),
            'BaseFolder'   : ('Базовый маршрут',        '',),
            'ArchiveFolder': ('АРХИВ',                  '',),
            'RD'           : ('Дата регистрации',       '',),
            'HasError'     : ('ОШИБКИ',                 '',),
        },
        'clients' : 'ClientID',
        'export'  : ('TID', 'ClientID', 'Client', 'Aliases', 'BP_FileID', 'PackageName', 'Qty', 'Host', 'BaseFolder', 'ArchiveFolder', 'RD', 'HasError',),
    },
    'orderstate-orders:by-type' : { \
        'columns' : 'self',
        'params'  : "%(client_id)s,%(config_id)s,%(action_id)s,'%(type)s','%(date_from)s','%(date_to)s',%(sort)s,''",
        'exec'    : '[OrderState].[dbo].[WEB_GetOrdersByConfigType_sp]',
        'headers' : 'self',
        'clients' : 'ClientID',
        'export'  : 'self',
    },
    'orderstate-events' : { \
        'columns' : ('TID', 'Action', 'Type', 'ToFolder', 'Result',), #, 'Started', 'Finished', 'Duration', 'Weight', 'RD',
        'view'    : '[OrderState].[dbo].[SHOW_vw]',
        'headers' : { \
            'TID'          : 'ID события',
            'ClientID'     : 'ID клиента',
            'ConfigID'     : 'ID сценария',
            'OrderID'      : 'ID заказа',
            'ActionID'     : 'ID операции',
            'Address'      : 'Событие',
            'Action'       : 'Операция', 
            'Type'         : 'Тип', 
            'ToFolder'     : 'МАРШРУТ НАЗНАЧЕНИЯ', 
            'Started'      : 'Дата старта', 
            'Finished'     : 'Дата завершения', 
            'Duration'     : '(мсек)', 
            'Weight'       : '%', 
            'Result'       : 'Результат', 
            'ErrorMessage' : 'Текст ошибки', 
            'RD'           : 'Дата регистрации',
        },
        'export'  : ('TID', 'ClientID', 'ConfigID', 'ActionID', 'OrderID', 'DestinationFileID', 'Address', 'Action', 'Type', 'ToFolder', 'Started', 'Finished', 'Duration', 'Weight', 'Result', 'ErrorMessage', 'RD'),
    },
    'orderstate-files' : { \
        'columns' : ('TID', 'Address', 'Name', 'IsError'), #, 'ConfigID', 'OrderID'
        'view'    : '[OrderState].[dbo].[SHOW_Files_vw]',
        'headers' : { \
            'TID'          : 'ID файла',
            'ConfigID'     : 'ID сценария',
            'OrderID'      : 'ID заказа',
            'Address'      : 'Событие',
            'Name'         : 'ИМЯ ФАЙЛА', 
            'IsError'      : 'Ошибка',
        },
        'export'  : ('TID', 'ConfigID', 'OrderID', 'Address', 'Name', 'IsError'),
    },
    'orderstate-errors' : { \
        'columns' : ('SourceFileID', 'OrderID', 'Address', 'Started', 'Finished', 'Result', 'ErrorMessage', 'RD',),
        'view'    : '[OrderState].[dbo].[SHOW_Errors_vw]',
        'headers' : { \
            'SourceFileID' : 'ID файла', 
            'OrderID'      : 'ID заказа',
            'Address'      : 'Событие',
            'Started'      : 'Дата старта', 
            'Finished'     : 'Дата завершения', 
            'Duration'     : '(мсек)', 
            'Weight'       : '%', 
            'Result'       : 'Результат', 
            'ErrorMessage' : 'СООБЩЕНИЕ ОБ ОШИБКЕ', 
            'RD'           : 'Дата регистрации',
        },
        'export'  : ('SourceFileID', 'OrderID', 'Address', 'Started', 'Finished', 'Duration', 'Weight', 'Result', 'ErrorMessage', 'RD'),
    },
    'orderstate-certificates' : { \
        'columns' : ('Event', 'Info', 'RD',),
        'view'    : '[OrderState].[dbo].[SHOW_OrderCertificates_vw]',
        'headers' : { \
            'TID'          : 'ID сертификата',
            'OrderID'      : 'ID заказа',
            'FileID'       : 'ID файла',
            'Address'      : 'Событие',
            'Name'         : 'Имя файла', 
            'Event'        : 'Событие/Файл',
            'Info'         : 'ИНФОРМАЦИЯ О СЕРТИФИКАТЕ',
            'RD'           : 'Дата регистрации',
        },
        'export'  : ('TID', 'OrderID', 'FileID', 'Address', 'Name', 'Info', 'RD',),
    },
    'orderstate-aliases' : { \
        'columns' : ('TID', 'Name', 'Title', 'Aliases',),
        'view'    : '[OrderState].[dbo].[SHOW_Aliases_vw]',
        'headers' : { \
            'TID'          : 'ID клиента',
            'Name'         : 'Клиент', 
            'Title'        : 'Полное наименование',
            'Aliases'      : 'Алиасы',
        },
        'export'  : ('TID', 'Name', 'Title', 'Aliases',),
    },
    'orderstate-actions' : { \
        'columns' : ('TID', 'Name',),
        'view'    : '[OrderState].[dbo].[DIC_Actions_tb]',
        'headers' : { \
            'TID'          : 'ID',
            'Name'         : 'Операция',
        },
        'clients' : 'TID',
    },
    'orderstate-clients' : { \
        'columns' : ('TID', 'Name',),
        'view'    : '[OrderState].[dbo].[DIC_Clients_tb]',
        'headers' : { \
            'TID'          : 'ID',
            'Name'         : 'Клиент',
        },
        'clients' : 'TID',
    },
    'orderstate-configs' : { \
        'columns' : ('TID', 'Name',),
        'view'    : '[OrderState].[dbo].[DIC_Configs_tb]',
        'headers' : { \
            'TID'          : 'ID',
            'Name'         : 'Сценарий',
        },
        'clients' : 'TID',
    },
    'orderstate-types' : { \
        'columns' : ('Type',),
        'view'    : '[OrderState].[dbo].[DIC_Configs_tb]',
    },
    'orderstate-eventinfo' : { \
        'columns' : ('PName', 'PValue', 'PSortIndex', 'PType',),
        'exec'    : '[OrderState].[dbo].[WEB_GetEventInfo_sp]',
        'headers' : { \
            'PName'        : 'Название параметра',
            'PValue'       : 'Значение',
            'PSortIndex'   : 'Индекс сортировки',
            'PType'        : 'Тип параметра',
        },
    },
    'orderstate-log': { \
        'columns' : ('Date', 'Code', 'Message',),
        'headers' : { \
            'Date'         : 'Дата Время',
            'Code'         : 'Результат',
            'Message'      : 'Текст сообщения',
        },
    },
    # ======================
    # BANKPERSO CONFIGURATOR
    # ======================
    'configurator-files' : { \
        'columns' : ('TID', 'ClientID', 'Client', 'FileType', 'ReportPrefix',),
        'view'    : '[BankDB].[dbo].[WEB_FileTypes_vw]',
        'headers' : { \
            'TID'          : ('ID типа файла',  '',),
            'ClientID'     : ('ID клиента',     '',),
            'Client'       : ('КЛИЕНТ',         '',),
            'FileType'     : ('ТИП ФАЙЛА',      '',),
            'ReportPrefix' : ('Префикс отчета', '',),
        },
        'clients' : 'ClientID',
        'export'  : ('TID', 'Client', 'FileType', 'ReportPrefix', 'ClientID', 'FileTypeID',),
    },
    'configurator-batches' : { \
        'columns' : ('TID', 'BatchTypeID', 'BatchType', 'MaxQty', 'IsErp', 'SortIndex', 'GroupIndex',), #, 'CreateType', 'ResultType'
        'view'    : '[BankDB].[dbo].[WEB_BatchTypes_vw]',
        'headers' : { \
            'TID'          : 'ID партии',
            'BatchTypeID'  : 'ID типа партии',
            'FileType'     : 'Тип файла',
            'BatchType'    : 'ТИП ПАРТИИ',
            'CreateType'   : 'Тип создания',
            'ResultType'   : 'Тип результата',
            'MaxQty'       : 'Максимальное количество карт',
            'IsErp'        : 'Флаг ERP', 
            'SortIndex'    : 'Индекс сортировки', 
            'GroupIndex'   : 'Индекс группировки', 
        },
        'export'  : ('TID', 'FileType', 'BatchType', 'CreateType', 'ResultType', 'MaxQty', 'IsErp', 'SortIndex', 'GroupIndex', 'FileTypeID', 'BatchTypeID', 'BatchCreateTypeID', 'BatchResultTypeID',),
    },
    'configurator-processes' : { \
        'columns' : ('TID', 'FileType', 'BatchType', 'CurrFileStatus', 'NextFileStatus', 'CloseFileStatus', 'ActivateBatchStatus', 'ARMBatchStatus', 'Memo'),
        'view'    : '[BankDB].[dbo].[WEB_FileProcesses_vw]',
        'headers' : { \
            'TID'                 : 'ID сценария',
            'FileType'            : 'Тип файла', 
            'BatchType'           : 'ПАРТИЯ',
            'CurrFileStatus'      : 'Текущий статус партии', 
            'NextFileStatus'      : 'Следующий статус партии', 
            'CloseFileStatus'     : 'Конечный статус партии', 
            'ActivateBatchStatus' : 'Статус активации партии', 
            'ARMBatchStatus'      : 'Статус партии в АРМ', 
            'Memo'                : 'Примечания',
        },
        'export'  : ('TID', 'FileType', 'BatchType', 'CurrFileStatus', 'NextFileStatus', 'CloseFileStatus', 'ActivateBatchStatus', 'ARMBatchStatus', 'Memo', 'CurrFileStatusID', 'NextFileStatusID', 'CloseFileStatusID', 'ActivateBatchStatusID', 'ARMBatchStatusID', 'FileTypeID', 'BatchTypeID', 'BatchCreateTypeID', 'BatchResultTypeID'),
    },
    'configurator-opers' : { \
        'columns' : ('TID', 'FileType', 'BatchType', 'OperTypeName', 'OperType', 'OperSortIndex',),
        'view'    : '[BankDB].[dbo].[WEB_FileOpers_vw]',
        'headers' : { \
            'TID'                 : 'ID операции',
            'FileType'            : 'Тип файла', 
            'BatchType'           : 'ПАРТИЯ',
            'OperTypeName'        : 'ОПЕРАЦИЯ',
            'OperType'            : 'Тип операции',
            'OperSortIndex'       : 'Индекс сортировки',
        },
        'export'  : ('TID', 'FileType', 'BatchType', 'OperTypeName', 'OperType', 'OperSortIndex', 'FBLinkID', 'OperID', 'BatchTypeID', 'FileTypeID'),
    },
    'configurator-operparams' : { \
        'columns' : ('TID', 'FileType', 'BatchType', 'OperTypeName', 'OperType', 'PName', 'PValue', 'Comment',),
        'view'    : '[BankDB].[dbo].[WEB_FileOperParams_vw]',
        'headers' : { \
            'TID'                 : 'ID параметра операции',
            'FileType'            : 'Тип файла', 
            'BatchType'           : 'ПАРТИЯ',
            'OperTypeName'        : 'Операция',
            'OperType'            : 'Тип операции',
            'PName'               : 'ПАРАМЕТР',
            'PValue'              : 'Значение параметра',
            'Comment'             : 'Примечания',
        },
        'export'  : ('TID', 'FileType', 'BatchType', 'OperTypeName', 'OperType', 'PName', 'PValue', 'Comment', 'FBOLinkID', 'FileTypeID', 'BatchTypeID', 'FBLinkID', 'OperID',),
    },
    'configurator-filters' : { \
        'columns' : ('TID', 'FileType', 'BatchType', 'TName', 'CriticalValues',),
        'view'    : '[BankDB].[dbo].[WEB_FileFilters_vw]',
        'headers' : { \
            'TID'                 : 'ID фильтра',
            'FileType'            : 'Тип файла', 
            'BatchType'           : 'ПАРТИЯ',
            'TName'               : 'Параметр',
            'CriticalValues'      : 'КРИТИЧЕСКОЕ ЗНАЧЕНИЕ',
        },
        'export'  : ('TID', 'FileType', 'BatchType', 'TName', 'CriticalValues', 'FileTypeID', 'BatchTypeID', 'FBLinkID', 'FTLinkID',),
    },
    'configurator-tags' : { \
        'columns' : ('TID', 'FileType', 'TName', 'TMemo',),
        'view'    : '[BankDB].[dbo].[WEB_FileTags_vw]',
        'headers' : { \
            'TID'                 : 'ID переменной',
            'FileType'            : 'Тип файла', 
            'TName'               : 'ПЕРЕМЕННАЯ',
            'TMemo'               : 'Примечания',
        },
        'export'  : ('TID', 'FileType', 'TName', 'TMemo', 'FileTypeID',),
    },
    'configurator-tagvalues' : { \
        'columns' : ('TID', 'FileType', 'TName', 'TValue',),
        'view'    : '[BankDB].[dbo].[WEB_FileTagValues_vw]',
        'headers' : { \
            'TID'                 : 'ID переменной',
            'FileType'            : 'Тип файла', 
            'TName'               : 'Переменная',
            'TValue'              : 'ЗНАЧЕНИЕ',
        },
        'export'  : ('TID', 'FileType', 'TName', 'TValue', 'FTLinkID', 'FileTypeID',),
    },
    'configurator-tzs' : { \
        'columns' : ('TID', 'FileType', 'TName', 'TValue', 'PName', 'PValue', 'PSortIndex', 'Comment',),
        'view'    : '[BankDB].[dbo].[WEB_FileTZs_vw]',
        'headers' : { \
            'TID'                 : 'ID переменной',
            'FileType'            : 'Тип файла', 
            'TName'               : 'Переменная',
            'TValue'              : 'Значение',
            'PName'               : 'ПАРАМЕТР',
            'PValue'              : 'ЗНАЧЕНИЕ', 
            'PSortIndex'          : 'Индекс сортировки',
            'Comment'             : 'Примечания',
        },
        'export'  : ('TID', 'FileType', 'TName', 'TValue', 'PName', 'PValue', 'Comment', 'PSortIndex', 'FileTypeID', 'FTVLinkID', 'TagParamID',),
    },
    'configurator-erpcodes' : { \
        'columns' : ('TID', 'FileType', 'TName', 'TValue', 'ERP_CODE', 'AdditionalInfo',),
        'view'    : '[BankDB].[dbo].[WEB_FileERPCodes_vw]',
        'headers' : { \
            'TID'                 : 'ID переменной',
            'FileType'            : 'Тип файла', 
            'BatchType'           : 'ПАРТИЯ',
            'TName'               : 'Переменная',
            'TValue'              : 'Значение',
            'ERP_CODE'            : 'Код ЕРП', 
            'AdditionalInfo'      : 'Дополнительная информация',
        },
        'export'  : ('TID', 'FileType', 'BatchType', 'TName', 'TValue', 'ERP_CODE', 'AdditionalInfo', 'FileTypeID', 'BatchTypeID', 'FTVLinkID',),
    },
    'configurator-materials' : { \
        'columns' : ('TID', 'FileType', 'BatchType', 'TName', 'TValue', 'PName', 'QtyMode', 'MMin', 'MBadPercent',),
        'view'    : '[BankDB].[dbo].[WEB_FileMaterials_vw]',
        'headers' : { \
            'TID'                 : 'ID переменной',
            'FileType'            : 'Тип файла', 
            'BatchType'           : 'ПАРТИЯ',
            'TName'               : 'Переменная',
            'TValue'              : 'Значение',
            'PName'               : 'МАТЕРИАЛ', 
            'QtyMode'             : 'Кол-во', 
            'MMin'                : 'Мин', 
            'MBadPercent'         : 'Брак, %',
        },
        'export'  : ('TID', 'FileType', 'BatchType', 'TName', 'TValue', 'CName', 'PName', 'QtyMode', 'MMin', 'MBadPercent', 'FileTypeID', 'BatchTypeID', 'FTVLinkID', 'TagParamID',),
    },
    'configurator-posts' : { \
        'columns' : ('TID', 'FileType', 'TName', 'TValue', 'PName', 'PValue', 'Comment',),
        'view'    : '[BankDB].[dbo].[WEB_FilePosts_vw]',
        'headers' : { \
            'TID'                 : 'ID переменной',
            'FileType'            : 'Тип файла', 
            'TName'               : 'Переменная',
            'TValue'              : 'Значение',
            'PName'               : 'ПАРАМЕТР ПОЧТЫ', 
            'PValue'              : 'Значение', 
            'Comment'             : 'Примечания',
        },
        'export'  : ('TID', 'FileType', 'TName', 'TValue', 'PName', 'PValue', 'Comment', 'FileTypeID', 'FTVLinkID', 'TagParamID',),
    },
    'configurator-processparams' : { \
        'columns' : ('TID', 'FileType', 'TName', 'TValue', 'PName', 'PValue', 'Comment', 'PSortIndex',),
        'view'    : '[BankDB].[dbo].[WEB_FileProcessParams_vw]',
        'headers' : { \
            'TID'                 : 'ID переменной',
            'FileType'            : 'Тип файла', 
            'TName'               : 'Переменная',
            'TValue'              : 'Значение',
            'PName'               : 'ПАРАМЕТР ПРОЦЕССА', 
            'PValue'              : 'Значение', 
            'Comment'             : 'Примечания',
            'PSortIndex'          : 'Индекс сортировки',
        },
        'export'  : ('TID', 'FileType', 'TName', 'TValue', 'PName', 'PValue', 'Comment', 'PSortIndex', 'FileTypeID', 'FTVLinkID', 'TagParamID',),
    },
    # --------------------
    # Фильтр конфигуратора
    # --------------------
    'configurator-clients' : { \
        'columns' : ('TID', 'CName',),
        'view'    : '[BankDB].[dbo].[DIC_Clients_tb]',
        'headers' : { \
            'TID'          : 'ID',
            'CName'        : 'Клиент',
        },
        'clients' : 'TID',
    },
    'configurator-filetypes' : { \
        'columns' : ('TID', 'CName',),
        'view'    : '[BankDB].[dbo].[DIC_FileType_vw]',
        'headers' : { \
            'TID'          : 'ID',
            'CName'        : 'Тип файла',
        },
        'filetypes' : 'TID',
    },
    'configurator-batchtypes' : { \
        'columns' : ('TID', 'CName',),
        'view'    : '[BankDB].[dbo].[DIC_BatchType_tb]',
        'headers' : { \
            'TID'          : 'ID',
            'BatchType'    : 'Тип партии',
        },
        'batchtypes' : 'TID',
    },
    'configurator-batchinfo' : { \
        'columns' : ('PName', 'PValue', 'PSortIndex', 'PType',),
        'exec'    : '[BankDB].[dbo].[WEB_GetBatchTypeInfo_sp]',
        'headers' : { \
            'PName'        : 'Название параметра',
            'PValue'       : 'Значение',
            'PSortIndex'   : 'Индекс сортировки',
            'PType'        : 'Тип параметра',
        },
    },
    # ==============
    # LOGGER SERVICE
    # ==============
    'orderlog-messages' : { \
        'columns' : ('TID', 'IP', 'Root', 'Module', 'LogFile', 'Code', 'Count', 'Message', 'EventDate',),
        'view'    : '[OrderLog].[dbo].[WEB_OrderMessages_vw]',
        'headers' : { \
            'TID'          : 'ID',
            'FileID'       : 'ID файла',
            'Client'       : 'КЛИЕНТ',
            'FileName'     : 'ФАЙЛ',
            'BatchID'      : 'ID партии',
            'Code'         : 'Результат',
            'Count'        : 'Всего сообщений',
            'Message'      : 'СООБЩЕНИЕ',
            'IsError'      : 'Ошибка',
            'IsWarning'    : 'Предупреждение',
            'IsOk'         : 'OK',
            'EventDate'    : 'Дата/Время',
        },
        'export'  : ('TID', 'SourceID', 'ModuleID', 'LogID', 'FileID', 'FileName', 'BatchID', 'Client', 'Code', 'Count', 'Message', 'IsError', 'IsWarning', 'IsInfo', 'SystemType', 'IP', 'Root', 'Module', 'LogFile', 'EventDate', 'RD'),
    },
    'orderlog-check-source' : { \
        'params'  : "0,'%(root)s','%(ip)s','%(ctype)s',null",
        'args'    : '0,%s,%s,%s,null',
        'exec'    : '[OrderLog].[dbo].[CHECK_Source_sp]',
    },
    'orderlog-check-module' : { \
        'params'  : "0,%(source_id)s,'%(cname)s','%(cpath)s',null",
        'args'    : '0,%d,%s,%s,null',
        'exec'    : '[OrderLog].[dbo].[CHECK_Module_sp]',
    },
    'orderlog-check-log' : { \
        'params'  : "0,%(source_id)s,%(module_id)s,'%(cname)s',null",
        'args'    : '0,%d,%d,%s,null',
        'exec'    : '[OrderLog].[dbo].[CHECK_Log_sp]',
    },
    'orderlog-register-log-message' : { \
        'params'  : "0,%(source_id)s,%(module_id)s,%(log_id)s,'%(source_info)s','%(module_info)s','%(log_info)s',%(fileid)s,%(batchid)s,'%(client)s','%(filename)s','%(code)s',%(count)s,'%(message)s','%(event_date)s','%(rd)s',null",
        'args'    : '0,%d,%d,%d,%s,%s,%s,%d,%d,%s,%s,%s,%d,%s,%s,%s,null',
        'exec'    : '[OrderLog].[dbo].[REGISTER_LogMessage_sp]',
    },
}

## -------------------------------
## Inheritance inside `config` XXX
## -------------------------------

for item in database_config:
    if not ':' in item:
        continue
    parent = item.split(':')[0]
    if not parent in database_config:
        continue
    for key in ('columns', 'headers', 'export',):
        if database_config[item][key] == 'self':
            database_config[item][key] = database_config[parent][key]

## ----------
## References
## ----------

def _reference_header(title, style, key=None):
    return {
        'title'   : title,
        'style'   : style,
        'key'     : key or key.lower(),
    }

def _reference_field(stype, selector, order=None, encoding=None):
    return {
        'type'    : stype,
        'selector': selector,
        'order'   : order,
        'encoding': encoding and True or False,
    }

_references = {
    'reference.clients' : {
        'columns' : ('TID', 'CName'),
        'view'    : '[BankDB].[dbo].[DIC_Clients_tb]',
        'headers' : {
            'TID'          : 'PK::id',
            'CName'        : 'Наименование::name',
        },
        'fields'  : {
            'TID'          : 'int:TID=%s',
            'CName'        : "varchar:CName like '%%%s%%':asc:1",
        },
    },
    'reference.file-status' : {
        'columns' : ('TID', 'StatusTypeID', 'CName'),
        'view'    : '[BankDB].[dbo].[DIC_FileStatus_tb]',
        'headers' : {
            'TID'          : 'PK::id',
            'StatusTypeID' : 'Тип статуса::fk',
            'CName'        : 'Наименование::name',
        },
        'fields'  : {
            'TID'          : 'int:TID=%s',
            'StatusTypeID' : 'int:StatusTypeID=%s',
            'CName'        : "varchar:CName like '%%%s%%':asc:1",
        },
    },
    'reference.batch-status' : {
        'columns' : ('TID', 'CName'),
        'view'    : '[BankDB].[dbo].[DIC_BatchStatus_tb]',
        'headers' : {
            'TID'          : 'PK::id',
            'CName'        : 'Наименование::name',
        },
        'fields'  : {
            'TID'          : 'int:TID=%s',
            'CName'        : "varchar:CName like '%%%s%%':asc:1",
        },
    },
    'reference.oper-list' : {
        'columns' : ('TID', 'TypeID', 'CName'),
        'view'    : '[BankDB].[dbo].[DIC_OperList_tb]',
        'headers' : {
            'TID'          : 'PK::id',
            'TypeID'       : 'Тип операции::fk',
            'CName'        : 'Наименование::name',
        },
        'fields'  : {
            'TID'          : 'int:TID=%s',
            'TypeID'       : 'int:TypeID=%s',
            'CName'        : "varchar:CName like '%%%s%%':asc:1",
        },
    },
    'reference.tag-params' : {
        'columns' : ('TID', 'PName', 'Comment'),
        'view'    : '[BankDB].[dbo].[DIC_TagParams_tb]',
        'headers' : {
            'TID'          : 'PK::id',
            'PName'        : 'Наименование::name',
            'Comment'      : 'Примечание::comment',
        },
        'fields'  : {
            'TID'          : 'int:TID=%s',
            'PName'        : "varchar:PName like '%%%s%%':asc:1",
            'Comment'      : "varchar:Comment like '%%%s%%'::1",
        },
    },
}

def getReferenceConfig(name):
    item = deepcopy(_references.get(name))
    for key in item['columns']:
        item['headers'][key] = _reference_header(*(item['headers'][key].split(':')))
        item['fields'][key] = _reference_field(*(item['fields'][key].split(':')))
    return item


class BankPersoEngine():
    
    def __init__(self, user=None, connection=None):
        self.connection = connection or default_connection
        self.engine = create_engine('mssql+pymssql://%(user)s:%(password)s@%(server)s' % self.connection)
        self.conn = self.engine.connect()
        self.engine_error = False
        self.user = user

        if IsDeepDebug:
            print('>>> open connection')

    def getReferenceID(self, name, key, value, tid='TID'):
        id = None
        
        if isinstance(value, str):
            where = "%s='%s'" % (key, value)
        else:
            where = '%s=%s' % (key, value)
            
        cursor = self.runQuery(name, top=1, columns=(tid,), where=where, distinct=True)
        if cursor:
            id = cursor[0][0]
        
        return id

    def _get_params(self, config, **kw):
        return 'exec_params' in kw and (config['params'] % kw['exec_params']) or kw.get('params') or ''

    def runProcedure(self, name, args=None, no_cursor=False, **kw):
        """
            Executes database stored procedure.
            Could be returned cursor.

            Parameter `with_error` can check error message/severity from SQL Server (raiserror).
        """
        if self.engine_error:
            return

        config = kw.get('config') or database_config[name]

        if args:
            sql = 'EXEC %(sql)s %(args)s' % { \
                'sql'    : config['exec'],
                'args'   : config['args'],
            }
        else:
            sql = 'EXEC %(sql)s %(params)s' % { \
                'sql'    : config['exec'],
                'params' : config['params'] % kw,
            }

        if IsDeepDebug:
            print('>>> runProcedure: %s' % sql)

        with_error = kw.get('with_error') and True or False

        return self.run(sql, args=args, no_cursor=no_cursor, with_error=with_error)

    def runQuery(self, name, top=None, columns=None, where=None, order=None, distinct=False, as_dict=False, **kw):
        """
            Executes as database query so a stored procedure.
            Returns cursor.
        """
        if self.engine_error:
            return []

        config = kw.get('config') or database_config[name]

        query_columns = columns or config.get('columns')

        if 'clients' in config and self.user is not None:
            profile_clients = self.user.get_profile_clients(True)
            if profile_clients:
                clients = '%s in (%s)' % ( \
                    config['clients'],
                    ','.join([str(x) for x in profile_clients])
                )

                if where:
                    where = '%s and %s' % (where, clients)
                else:
                    where = clients

        if 'view' in config and config['view']:
            params = { \
                'distinct' : distinct and 'DISTINCT' or '',
                'top'      : (top and 'TOP %s' % str(top)) or '',
                'columns'  : ','.join(query_columns),
                'view'     : config['view'],
                'where'    : (where and 'WHERE %s' % where) or '',
                'order'    : (order and 'ORDER BY %s' % order) or '',
            }
            sql = 'SELECT %(distinct)s %(top)s %(columns)s FROM %(view)s %(where)s %(order)s' % params
        else:
            params = { \
                'sql'      : config['exec'],
                'params'   : self._get_params(config, **kw),
            }
            sql = 'EXEC %(sql)s %(params)s' % params

        if IsDeepDebug:
            print('>>> runQuery: %s' % sql)

        rows = []

        encode_columns = kw.get('encode_columns') or []
        worder_columns = kw.get('worder_columns') or []

        mapping = kw.get('mapping')

        cursor = self.execute(sql)

        if cursor is not None and not cursor.closed:
            if IsDeepDebug:
                print('--> in_transaction:%s' % cursor.connection.in_transaction())

            for n, line in enumerate(cursor):
                if as_dict and query_columns:
                    row = dict(zip(query_columns, line))
                else:
                    row = [x for x in line]
                for col in encode_columns:
                    row[col] = row[col] and row[col].encode(default_iso).decode(default_encoding) or ''
                for col in worder_columns:
                    row[col] = splitter(row[col], length=None, comma=':')
                if mapping:
                    row = dict([(key, row.get(name)) for key, name in mapping])
                rows.append(row)

            cursor.close()

        return rows

    def runCommand(self, sql, **kw):
        """
            Run sql-command with transaction.
            No returned cursor.
        """
        if self.engine_error:
            return

        if IsDeepDebug:
            print('>>> runCommand: %s' % sql)

        with_error = kw.get('with_error') and True or False

        return self.run(sql, no_cursor=True, with_error=with_error)

    def run(self, sql, args=None, no_cursor=False, with_error=False):
        if self.conn is None or self.conn.closed:
            if with_error:
                return [], ''
            else:
                return None

        rows = []
        error_msg = ''

        with self.conn.begin() as trans:
            try:
                if args:
                    cursor = self.conn.execute(sql, args)
                else:
                    cursor = self.conn.execute(sql)
                if not no_cursor:
                    rows = [row for row in cursor if cursor]
                trans.commit()
            except Exception as err:
                trans.rollback()

                if err is not None and hasattr(err, 'orig') and isinstance(err.orig, pymssql.OperationalError):
                    msg = len(err.orig.args) > 1 and err.orig.args[1] or ''
                    error_msg = msg and msg.decode().split('\n')[0] or 'unexpected error'
                    
                    if 'DB-Lib' in error_msg:
                        error_msg = re.sub(r'(,\s)', r':', re.sub(r'(DB-Lib)', r':\1', error_msg))
                else:
                    error_msg = 'database error'

                self.engine_error = True

                print_to(None, 'NO SQL QUERY: %s ERROR: %s' % (sql, error_msg))
                print_exception()

        if with_error:
            return rows, error_msg

        return rows

    def execute(self, sql):
        try:
            return self.engine.execute(sql)
        except:
            print_to(None, 'NO SQL EXEC: %s' % sql)
            print_exception()

            self.engine_error = True

            return None

    def dispose(self):
        self.engine.dispose()

        if IsDeepDebug:
            print('>>> dispose')

    def close(self):
        self.conn.close()

        if IsDeepDebug:
            print('>>> close connection')

        self.dispose()
