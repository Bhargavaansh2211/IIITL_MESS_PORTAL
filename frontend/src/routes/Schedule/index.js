import classes from './index.module.css';
import { Table, message, Card, Rate, Typography } from 'antd';
import { useMediaQuery } from 'react-responsive';
import WeekMenu from '../../components/WeekMenu';
import axios from "axios";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

// Updated timing table columns with "Cost" column added
const timingCol = [
    {
        title: 'Meal',
        dataIndex: 'meal',
        key: 'meal',
        render: (text) => ({
            props: { style: { background: "#FAFAFA" } },
            children: <span style={{ fontWeight: 500 }}>{text}</span>
        })
    },
    {
        title: 'Time',
        dataIndex: 'time',
        key: 'time'
    },
    { // new column for cost
        title: 'Cost',
        dataIndex: 'cost',
        key: 'cost'
    }
];

export default function SchedulePage() {
    const mobile = useMediaQuery({ query: '(max-width: 750px)' });
    const [timingRow, setTimingRow] = useState([]);
    const [menu, setMenu] = useState([]);
    const [ratingData, setRatingData] = useState(null);
    const [status, setStatus] = useState({ loggedIn: false, admin: false });

    useEffect(() => {
        const fetchTime = async () => {
            try {
                let responseTime = await axios.get(window.APIROOT + 'api/data/time');
                setTimingRow(responseTime.data);
            } catch (error) {
                message.error('Failed to fetch timing from server');
            }
        }
        fetchTime();
    }, []);

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const response = await axios.get(window.APIROOT + 'api/data/status');
                setStatus(response.data);
            } catch (error) {
                message.error('Failed to fetch login status');
            }
        }
        fetchStatus();
    }, []);

    useEffect(() => {
        const fetchMenu = async () => {
            try {
                const responseMenu = await axios.get(window.APIROOT + 'api/data/menu');
                setMenu(responseMenu.data);
            } catch (error) {
                message.error('Failed to fetch menu from server');
            }
        }
        fetchMenu();
    }, []);

    useEffect(() => {
        const fetchRatings = async () => {
            if (!status.loggedIn) return;
            try {
                const response = await axios.get(window.APIROOT + 'api/user/dishRatings/today');
                setRatingData(response.data);
            } catch (error) {
                message.error('Failed to fetch today dish ratings');
            }
        }
        fetchRatings();
    }, [status.loggedIn]);

    const saveRating = async (meal, value) => {
        try {
            await axios.post(window.APIROOT + 'api/user/dishRatings', { meal, rating: value });
            setRatingData((prev) => ({ ...prev, ratings: { ...(prev?.ratings || {}), [meal]: value } }));
            message.success('Rating saved');
        } catch (error) {
            message.error('Failed to save rating');
        }
    }

    return (
        <div className={classes.menuBody}>
            <h1>TIMING</h1>
            <Table 
                loading={!timingRow.length} 
                className={classes.table} 
                columns={timingCol} 
                dataSource={timingRow} 
                pagination={false} 
                bordered 
            />
            <h1>MENU</h1>
            <motion.div layout>
                <WeekMenu loading={!menu.length} menu={menu} mobile={mobile} />
            </motion.div>

            {status.loggedIn && ratingData ? (
                <Card style={{ marginTop: '1rem' }}>
                    <h1 style={{ marginTop: 0 }}>RATE TODAY'S DISHES ({ratingData.day?.toUpperCase()})</h1>
                    {['breakfast', 'lunch', 'dinner'].map((meal) => (
                        <div key={meal} style={{ marginBottom: '1rem' }}>
                            <Typography.Text strong style={{ textTransform: 'capitalize' }}>{meal}: </Typography.Text>
                            <Typography.Text>{ratingData.dayMenu?.[meal]}</Typography.Text>
                            <br />
                            <Rate value={ratingData.ratings?.[meal] || 0} onChange={(v) => saveRating(meal, v)} />
                        </div>
                    ))}
                </Card>
            ) : null}
        </div>
    );
}
