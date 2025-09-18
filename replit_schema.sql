--
-- PostgreSQL database dump
--

-- Dumped from database version 16.9 (02a153c)
-- Dumped by pg_dump version 16.9

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: graffiti_reports; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.graffiti_reports (
    id integer NOT NULL,
    photos json NOT NULL,
    latitude real NOT NULL,
    longitude real NOT NULL,
    district text NOT NULL,
    description text NOT NULL,
    name text,
    email text,
    status text DEFAULT 'new'::text NOT NULL,
    validated text DEFAULT 'pending'::text NOT NULL,
    property_owner text,
    property_description text,
    "timestamp" timestamp without time zone DEFAULT now() NOT NULL,
    csv_data text,
    folder_path text,
    graffiti_type text
);


--
-- Name: graffiti_reports_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.graffiti_reports_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: graffiti_reports_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.graffiti_reports_id_seq OWNED BY public.graffiti_reports.id;


--
-- Name: report_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.report_history (
    id integer NOT NULL,
    report_id integer NOT NULL,
    action text NOT NULL,
    old_value text,
    new_value text NOT NULL,
    admin_user text,
    notes text,
    "timestamp" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: report_history_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.report_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: report_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.report_history_id_seq OWNED BY public.report_history.id;


--
-- Name: graffiti_reports id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.graffiti_reports ALTER COLUMN id SET DEFAULT nextval('public.graffiti_reports_id_seq'::regclass);


--
-- Name: report_history id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.report_history ALTER COLUMN id SET DEFAULT nextval('public.report_history_id_seq'::regclass);


--
-- Name: graffiti_reports graffiti_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.graffiti_reports
    ADD CONSTRAINT graffiti_reports_pkey PRIMARY KEY (id);


--
-- Name: report_history report_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.report_history
    ADD CONSTRAINT report_history_pkey PRIMARY KEY (id);


--
-- Name: report_history report_history_report_id_graffiti_reports_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.report_history
    ADD CONSTRAINT report_history_report_id_graffiti_reports_id_fk FOREIGN KEY (report_id) REFERENCES public.graffiti_reports(id);


--
-- PostgreSQL database dump complete
--

