package main

import (
	"encoding/json"
	"fmt"
	"time"
)

type Order struct {
	ID	   int `json:"id"`
	Acount float64 `json:"amount"`
	Status string `json:"status"`
	CreatedAt time.Time `json:"created_at"`
}

func (o *Order) ChangeStatus(newStatus string) {
	o.Status = newStatus
}

func main() {
	order1 := Order{
		ID: 1,
		Acount: 100.50,
		Status: "Pending",
		CreatedAt: time.Now(),
	}

	fmt.Println("Order ID:", order1.ID)
	fmt.Println("Order Amount:", order1.Acount)
	fmt.Println("Order Status:", order1.Status)
	fmt.Println("Order Created At:", order1.CreatedAt)

	result, _ := json.Marshal(order1)
	fmt.Println("JSON Representation:", string(result))

	order1.ChangeStatus("Shipped")
	fmt.Println("Updated Order Status:", order1.Status)
}